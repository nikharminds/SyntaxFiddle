import { describe, expect, it } from "vitest";
import { formatSOQL } from "../soql";

describe("SOQL clause capitalization and line breaks", () => {
  it("capitalizes core clauses and breaks before major clauses", () => {
    expect(formatSOQL("select id, name from account")).toBe("SELECT id, name\nFROM account");
  });

  it("formats a single-line minified query with compact commas and no operator spaces", () => {
    expect(formatSOQL("select id,name,custom__c from account where createddate=today")).toBe(
      ["SELECT id, name, custom__c", "FROM account", "WHERE", "    createddate = TODAY"].join("\n"),
    );
  });

  it("breaks select lists after commas when there are more than three fields", () => {
    expect(formatSOQL("select id, name, title, email from user")).toBe(
      ["SELECT", "    id,", "    name,", "    title,", "    email", "FROM user"].join("\n"),
    );
  });

  it("keeps select lists of up to three fields inline", () => {
    expect(formatSOQL("SELECT Id, Name, Title FROM User")).toBe("SELECT Id, Name, Title\nFROM User");
  });

  it("breaks three-field lists when the line would get too long", () => {
    const query =
      "SELECT ns__Really_Long_Field_Name_One__c, ns__Really_Long_Field_Name_Two__c, ns__Really_Long_Field_Name_Three__c FROM Object__c";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT",
        "    ns__Really_Long_Field_Name_One__c,",
        "    ns__Really_Long_Field_Name_Two__c,",
        "    ns__Really_Long_Field_Name_Three__c",
        "FROM Object__c",
      ].join("\n"),
    );
  });

  it("formats trailing clauses each on their own line", () => {
    expect(formatSOQL("select id from account limit 100 offset 200")).toBe(
      ["SELECT id", "FROM account", "LIMIT 100", "OFFSET 200"].join("\n"),
    );
  });
});

describe("SOQL subqueries", () => {
  it("indents parent-to-child subqueries one additional level", () => {
    expect(formatSOQL("SELECT Id, Name, (SELECT LastName, Email FROM Contacts) FROM Account")).toBe(
      [
        "SELECT",
        "    Id,",
        "    Name,",
        "    (",
        "        SELECT LastName, Email",
        "        FROM Contacts",
        "    )",
        "FROM Account",
      ].join("\n"),
    );
  });

  it("formats multiple sibling subqueries in the same select list", () => {
    const query =
      "SELECT Id, (SELECT Id, Name FROM Contacts), (SELECT Id FROM Opportunities) FROM Account";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT",
        "    Id,",
        "    (",
        "        SELECT Id, Name",
        "        FROM Contacts",
        "    ),",
        "    (",
        "        SELECT Id",
        "        FROM Opportunities",
        "    )",
        "FROM Account",
      ].join("\n"),
    );
  });

  it("indents semi-join subqueries inside WHERE ... IN", () => {
    const query =
      "SELECT Id FROM Account WHERE Id IN (SELECT AccountId FROM Contact) AND Industry = 'Tech'";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT Id",
        "FROM Account",
        "WHERE",
        "    Id IN (",
        "        SELECT AccountId",
        "        FROM Contact",
        "    )",
        "    AND Industry = 'Tech'",
      ].join("\n"),
    );
  });

  it("handles nested subqueries at increasing depths", () => {
    const query = "SELECT Name, (SELECT LastName, (SELECT Name FROM Tasks) FROM Contacts) FROM Account";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT",
        "    Name,",
        "    (",
        "        SELECT",
        "            LastName,",
        "            (",
        "                SELECT Name",
        "                FROM Tasks",
        "            )",
        "        FROM Contacts",
        "    )",
        "FROM Account",
      ].join("\n"),
    );
  });

  it("formats clauses inside subqueries with their own indentation", () => {
    const query =
      "select name,(select lastname,email from contacts where email like '%@example.com' order by lastname limit 5) from account";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT",
        "    name,",
        "    (",
        "        SELECT lastname, email",
        "        FROM contacts",
        "        WHERE",
        "            email LIKE '%@example.com'",
        "        ORDER BY lastname",
        "        LIMIT 5",
        "    )",
        "FROM account",
      ].join("\n"),
    );
  });
});

describe("SOQL WHERE clause formatting", () => {
  it("breaks top-level AND/OR connectors onto their own indented lines", () => {
    const query =
      "SELECT Id FROM Opportunity WHERE (StageName = 'Closed Won' OR StageName = 'Closed Lost') AND Amount > 10000";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT Id",
        "FROM Opportunity",
        "WHERE",
        "    (StageName = 'Closed Won' OR StageName = 'Closed Lost')",
        "    AND Amount > 10000",
      ].join("\n"),
    );
  });

  it("keeps AND/OR nested inside grouping parentheses inline and capitalized", () => {
    const query =
      "select id from lead where (rating = 'hot' or status = 'working' and isconverted = false) and (source = 'web' or industry like 'Tech%')";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT id",
        "FROM lead",
        "WHERE",
        "    (rating = 'hot' OR status = 'working' AND isconverted = FALSE)",
        "    AND (source = 'web' OR industry LIKE 'Tech%')",
      ].join("\n"),
    );
  });

  it("normalizes operator spacing in compact WHERE conditions", () => {
    const query = "select id from contact where firstname='Maria' and lastname='Jones'";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT id",
        "FROM contact",
        "WHERE",
        "    firstname = 'Maria'",
        "    AND lastname = 'Jones'",
      ].join("\n"),
    );
  });
});

describe("Salesforce-specific syntax", () => {
  it("never splits __c / __r / __mdt field paths", () => {
    const query =
      "select contact__r.first_name__c, amount, custom_field__c, owner__r.profile.name from opportunity__c where my_status__c = 'open' order by createddate limit 100";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT",
        "    contact__r.first_name__c,",
        "    amount,",
        "    custom_field__c,",
        "    owner__r.profile.name",
        "FROM opportunity__c",
        "WHERE",
        "    my_status__c = 'open'",
        "ORDER BY createddate",
        "LIMIT 100",
      ].join("\n"),
    );
  });

  it("queries custom metadata objects", () => {
    expect(formatSOQL("select MasterLabel, DeveloperName from Revenue_Country__mdt limit 10")).toBe(
      "SELECT MasterLabel, DeveloperName\nFROM Revenue_Country__mdt\nLIMIT 10",
    );
  });

  it("formats TYPEOF polymorphic expressions", () => {
    const query =
      "SELECT TYPEOF What WHEN Account THEN What.Phone WHEN Opportunity THEN Amount ELSE WhatId END FROM Event";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT",
        "    TYPEOF What",
        "        WHEN Account THEN What.Phone",
        "        WHEN Opportunity THEN Amount",
        "        ELSE WhatId",
        "    END",
        "FROM Event",
      ].join("\n"),
    );
  });

  it("formats TYPEOF cleanly when the ELSE branch is omitted", () => {
    expect(formatSOQL("SELECT TYPEOF What WHEN Account THEN Phone END FROM Event")).toBe(
      [
        "SELECT",
        "    TYPEOF What",
        "        WHEN Account THEN Phone",
        "    END",
        "FROM Event",
      ].join("\n"),
    );
  });

  it("capitalizes WITH SECURITY_ENFORCED", () => {
    const query =
      "select id from account where industry = 'tech' with security_enforced order by name desc nulls last limit 50";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT id",
        "FROM account",
        "WHERE",
        "    industry = 'tech'",
        "WITH SECURITY_ENFORCED",
        "ORDER BY name DESC NULLS LAST",
        "LIMIT 50",
      ].join("\n"),
    );
  });

  it("handles date literals, datetime values, currency literals and negative numbers", () => {
    const query =
      "select id from opportunity where close_date > last_n_days:30 and amount > USD5000 and probability != -0.5 and created_date = 2024-01-15T10:30:00Z and due_date > TODAY limit 10";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT id",
        "FROM opportunity",
        "WHERE",
        "    close_date > LAST_N_DAYS:30",
        "    AND amount > USD5000",
        "    AND probability != -0.5",
        "    AND created_date = 2024-01-15T10:30:00Z",
        "    AND due_date > TODAY",
        "LIMIT 10",
      ].join("\n"),
    );
  });

  it("preserves apex bind variables and escaped quotes in strings", () => {
    expect(formatSOQL("SELECT Id FROM Account WHERE Name = :name LIMIT :limitSize")).toBe(
      ["SELECT Id", "FROM Account", "WHERE", "    Name = :name", "LIMIT :limitSize"].join("\n"),
    );
    expect(formatSOQL("SELECT Id FROM Account WHERE Name = 'O\\'Brien %'")).toBe(
      ["SELECT Id", "FROM Account", "WHERE", "    Name = 'O\\'Brien %'"].join("\n"),
    );
  });

  it("keeps object names like Order and Group intact when not clauses", () => {
    expect(formatSOQL("select id from Order where status = 'draft' order by createddate desc")).toBe(
      ["SELECT id", "FROM Order", "WHERE", "    status = 'draft'", "ORDER BY createddate DESC"].join("\n"),
    );
    expect(formatSOQL("select id from Group limit 5")).toBe("SELECT id\nFROM Group\nLIMIT 5");
  });

  it("keeps IN lists inline and supports NOT IN, INCLUDES and functions", () => {
    expect(formatSOQL("SELECT toLabel(RecordType.Name), convertCurrency(Amount) FROM Opportunity")).toBe(
      "SELECT TOLABEL(RecordType.Name), CONVERTCURRENCY(Amount)\nFROM Opportunity",
    );
    expect(
      formatSOQL("SELECT Id FROM Contact WHERE Status IN ('a','b') AND Rating NOT IN ('hot','cold')"),
    ).toBe(
      [
        "SELECT Id",
        "FROM Contact",
        "WHERE",
        "    Status IN ('a', 'b')",
        "    AND Rating NOT IN ('hot', 'cold')",
      ].join("\n"),
    );
  });

  it("handles GROUP BY with HAVING, aggregate aliases and ORDER BY", () => {
    const query =
      "SELECT Industry, COUNT(Id) cnt FROM Account GROUP BY Industry HAVING COUNT(Id) > 5 ORDER BY cnt DESC";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT Industry, COUNT(Id) cnt",
        "FROM Account",
        "GROUP BY Industry",
        "HAVING",
        "    COUNT(Id) > 5",
        "ORDER BY cnt DESC",
      ].join("\n"),
    );
  });

  it("handles WITH DATA CATEGORY filters without breaking their AND/OR", () => {
    const query =
      "SELECT Id FROM Article WHERE Title = 'x' WITH DATA CATEGORY Geography__c ABOVE 'US' AND Product__c AT ('laptop','mobile') ORDER BY Title";
    expect(formatSOQL(query)).toBe(
      [
        "SELECT Id",
        "FROM Article",
        "WHERE",
        "    Title = 'x'",
        "WITH DATA CATEGORY Geography__c ABOVE 'US' AND Product__c AT ('laptop', 'mobile')",
        "ORDER BY Title",
      ].join("\n"),
    );
  });

  it("handles FOR UPDATE, ALL ROWS and USING SCOPE", () => {
    expect(formatSOQL("select id from account where name != 'x' for update")).toBe(
      ["SELECT id", "FROM account", "WHERE", "    name != 'x'", "FOR UPDATE"].join("\n"),
    );
    expect(formatSOQL("SELECT Id FROM Account USING SCOPE Mine LIMIT 10")).toBe(
      ["SELECT Id", "FROM Account", "USING SCOPE Mine", "LIMIT 10"].join("\n"),
    );
  });
});

describe("SOQL formatter robustness", () => {
  it("returns empty output for empty or whitespace-only input", () => {
    expect(formatSOQL("")).toBe("");
    expect(formatSOQL("   \n\t ")).toBe("");
  });

  it("preserves a trailing statement semicolon", () => {
    expect(formatSOQL("select id from account;")).toBe("SELECT id\nFROM account;");
  });

  it("is idempotent for complex queries", () => {
    const input = [
      "select id, name, (select lastname, email from contacts where email like '%@example.com'",
      " order by lastname limit 5), account__r.industry, custom_field__c from opportunity",
      " where stage != 'closed won' and amount > USD5000 and owner.id in (select id from user",
      " where isactive = true) with security_enforced order by amount desc nulls last limit 100",
    ].join(" ");
    const once = formatSOQL(input);
    expect(formatSOQL(once)).toBe(once);
  });

  it("supports custom indentation options", () => {
    expect(formatSOQL("select a,b,c,d from x", { indent: "  " })).toBe(
      ["SELECT", "  a,", "  b,", "  c,", "  d", "FROM x"].join("\n"),
    );
  });
});
