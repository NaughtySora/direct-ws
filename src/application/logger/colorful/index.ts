import { palette } from 'naughty-util';

const {
  dye,
  COLORS: { blue, green, red, yellow },
} = palette;
const intl = new Intl.DateTimeFormat(undefined, {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});
const formatDate = (date = new Date()) => intl.format(date);
const date = () => dye(blue, formatDate());

export default Object.assign({}, console, {
  log(...logs: any[]) {
    const title = dye(green, '[log]:');
    console.log(title, date(), ...logs);
  },
  error(...logs: any[]) {
    const title = dye(red, '[error]:');
    console.log(title, date(), ...logs);
  },
  warn(...logs: any[]) {
    const title = dye(yellow, '[warn]:');
    console.log(title, date(), ...logs);
  },
  info(...logs: any[]) {
    const title = dye(blue, '[info]:');
    console.log(title, date(), ...logs);
  },
});
