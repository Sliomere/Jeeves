#!/usr/bin/env node
/**
 * EXIT CODES:
 * 1: No Admin
 * 2: Wrong domain
 */

const isElevated = require("is-elevated");

(async () => {
  let root = await isElevated();

  if (root) {
    require("./main");
  } else {
    console.error(
      "Jeeves requires administrator/sudo rights to function! It edits your hosts file!"
    );
    process.exit(1);
  }
})();
