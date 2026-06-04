import * as xlsx from 'xlsx';
import fs from 'fs';

const buf = fs.readFileSync('Auranagbad Zone _Supervisor For.xlsx');
const workbook = xlsx.read(buf, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log("Headers:");
console.log(data[0]);
console.log("\nFirst row:");
console.log(data[1]);
console.log("\nSecond row:");
console.log(data[2]);
