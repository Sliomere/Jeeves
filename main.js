const shelljs = require("shelljs");
const readline = require("readline");
const fs = require("fs");
const hostile = require("hostile");
const yargs = require("yargs");
const config = require("./config");
const Tonto = require("tonto");

yargs
  .command(
    ["link [domain]", "$0 [domain]"],
    "Add a domain",
    yargs => {
      yargs.option("domain", {
        describe: "The domain you wish to link",
        default: process
          .cwd()
          .split(require("path").sep)
          .slice(-1)[0]
      });
    },
    argv => {
      if (!argv.domain.endsWith(".test")) {
        argv.domain += ".test";
      }
      argv.domain = argv.domain.toLowerCase();
      addDomainToHosts(argv.domain);
      addVirtualHost(argv.domain);
    }
  )
  .command(
    "unlink [domain]",
    "Remove a domain",
    yargs => {
      yargs.option("domain", {
        describe: "The domain you wish to unlink",
        default: process
          .cwd()
          .split(require("path").sep)
          .splice(-1)[0]
      });
    },
    argv => {
      if (!argv.domain.endsWith(".test")) {
        argv.domain += ".test";
      }
      argv.domain = argv.domain.toLowerCase();
      removeDomainFromHosts(argv.domain);
      removeVirtualHost(argv.domain);
    }
  )
  .parse();

function addDomainToHosts(domain) {
  hostile.set("127.0.0.1", domain, function(err) {
    if (err) throw err;
    console.log("Host file edited successfully!");
  });
}

function removeDomainFromHosts(domain) {
  hostile.remove("127.0.0.1", domain, function(err) {
    if (err) throw err;
    console.log("Host file edited successfully!");
  });
}

function addVirtualHost(domain) {
  let readStream = fs.createReadStream(config.vhostsFile);
  let lineReader = readline.createInterface({
    input: readStream
  });

  let alreadyContains = false;

  lineReader.on("line", line => {
    if (line.trim().endsWith("# JeevesInfo: " + domain)) {
      alreadyContains = true;
    }
  });

  lineReader.on("close", () => {
    if (alreadyContains) {
      removeVirtualHost(domain, () => {
        constructWriteVirtualHost(domain);
      });
    } else {
      constructWriteVirtualHost(domain);
    }
  });
}

function constructWriteVirtualHost(domain) {
  let tonto = new Tonto("2.4");
  // tonto.serverName(domain);
  tonto.virtualHost("*:80", function(sub) {
    let sep = require("path").sep;
    let cwd = process.cwd();
    if (!cwd.endsWith(sep + "public") && config.laravel) {
      cwd += sep + "public";
    }
    cwd = '"' + cwd + '"';
    sub.serverName(domain);
    sub.documentRoot(cwd);
    sub.directory(cwd, function(subDirectory) {
      subDirectory.options("All");
      subDirectory.allowOverride("All");
      subDirectory.require("all granted");
    });
    sub.errorLog(
      "${SRVROOT}" + sep + "logs" + sep + "error-" + domain + ".log"
    );
    sub.customLog(
      "${SRVROOT}" + sep + "logs" + sep + "access-" + domain + ".log combined"
    );
  });

  let vhost = tonto.render().split("\n");
  vhost[0] = "\n" + vhost[0] + "# JeevesInfo: " + domain;
  vhost = vhost.join("\n").replace("RewriteEngine", "ReWriteEngine") + "\n";

  fs.appendFile(config.vhostsFile, vhost, err => {
    if (err) throw err;
    console.log("VirtualHost created!");
    reloadApache();
  });
}

function removeVirtualHost(domain, cb = () => {}) {
  let readStream = fs.createReadStream(config.vhostsFile);
  let lineReader = readline.createInterface({
    input: readStream
  });

  let shouldRemove = false;
  let fileLines = [];
  let linesToRemove = [];
  let i = 0;

  lineReader.on("line", function(line) {
    fileLines.push(line);
    if (line.trim().endsWith("# JeevesInfo: " + domain)) {
      shouldRemove = true;
    } else if (shouldRemove && line.trim().startsWith("</VirtualHost")) {
      shouldRemove = false;
      linesToRemove.push(i);
    }

    if (shouldRemove) {
      linesToRemove.push(i);
    }
    i++;
  });

  lineReader.on("close", () => {
    fs.writeFile(
      config.vhostsFile,
      removeLines(fileLines, linesToRemove),
      err => {
        if (err) throw err;
        console.log("VirtualHost removed!");
        reloadApache();
        cb();
      }
    );
  });
}

function reloadApache() {
  shelljs.exec("httpd -k restart");
}

function removeLines(data, lines = []) {
  return data.filter((val, idx) => lines.indexOf(idx) === -1).join("\n");
}
