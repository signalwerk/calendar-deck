import Parser from "./Parser";
import icsExporter from "./icsExporter";

const Lib = {
  Parser,
  Exporter: {
    ics: icsExporter
  }
};

export default Lib;
