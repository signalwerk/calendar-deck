#!/usr/bin/env node
const cDeck = require("./");
const fs = require("fs");
const path = require("path");

const {
  Parser,
  Exporter: { ics: icsExporter }
} = cDeck;

var argv = require("yargs")
  .scriptName("calendarDeck")

  .usage("Usage: $0 <command> [options] filename.txt")
  .command("build", "build calendars of input-path")
  .demandCommand(1, "must provide a valid command")
  .recommendCommands()
  .example(
    "$0 build --outputFormat=ics --outputPath=./build ./dates.txt",
    "generates ./build/dates.ics from dates.txt"
  )
  .nargs("outputFormat", 1)
  .describe("outputFormat", "format of output")
  .nargs("outputPath", 1)
  .describe("outputPath", "path of output")
  .demandOption(["outputFormat", "outputPath"])
  .help("h")
  .alias("h", "help")
  .alias("version", "v")
  .epilog("A human editable and machine readable calendar-lists.").argv;

if (argv._.length != 2 || argv._[0] !== "build") {
  console.log("Only use build command with a input-path");
  process.exit(1);
}

if (argv.outputFormat !== "ics") {
  console.log("Only ics allowed for output format");
  process.exit(1);
}

const inputPath = argv._[1];
if (!fs.existsSync(inputPath)) {
  console.log("input-path was not found");
  process.exit(1);
}

// Is output dir existing
if (!fs.lstatSync(argv.outputPath).isDirectory()) {
  console.error("output directory does not exists");
  process.exit(1);
}

const generator = (icsPath, filePaths) => {
  let parser = new Parser();
  filePaths.map(path => parser.parse(fs.readFileSync(path, "utf8")));

  let ics = new icsExporter(parser.events);
  let out = ics.ics();
  fs.writeFileSync(icsPath, out);
};

const getFilesFromFolder = files => {
  const txtFiles = files
    .filter(dirent => dirent.isFile() && /\.txt$/.test(dirent.name))
    .map(dirent => dirent.name);

  return txtFiles;
};

// Query the entry
const stats = fs.lstatSync(inputPath);

// input is a directory
if (stats.isDirectory()) {
  // convert all files
  const files = fs.readdirSync(inputPath, { withFileTypes: true });
  const txtFiles = getFilesFromFolder(files);

  txtFiles.map(item => {
    const basename = item.replace(/\.[^/.]+$/, "");
    const exprtPath = path.resolve(`${argv.outputPath}/${basename}.ics`);
    generator(exprtPath, [path.resolve(`${inputPath}/${item}`)]);
  });

  // convert all folders
  const folders = files
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  folders.map(folder => {
    const exprtPath = path.resolve(`${argv.outputPath}/${folder}.ics`);

    const filesInFolders = fs.readdirSync(`${inputPath}/${folder}`, {
      withFileTypes: true
    });

    const txtFiles = getFilesFromFolder(filesInFolders).map(item => {
      return path.resolve(`${inputPath}/${folder}/${item}`);
    });

    generator(exprtPath, txtFiles);
  });

  return;
}

// input is a file
if (stats.isFile()) {
  const basename = path.basename(inputPath).replace(/\.[^/.]+$/, "");
  const exprtPath = path.resolve(`${argv.outputPath}/${basename}.ics`);

  generator(exprtPath, [inputPath]);
  return;
}
