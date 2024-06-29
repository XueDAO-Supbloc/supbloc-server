import {appendFileSync} from 'fs';
import moment from 'moment-timezone';

class Logger{
  constructor(){ //readonly logFile?: string
    this.debug('logger initialized');
  }
  currentTime() {
    return '[' + moment().tz('Asia/Taipei').format('YYYY/MM/DD hh:mm:ss') + ']';
  }
  writeLog(content, logLevel){
    const line = `${this.currentTime()} ${logLevel}: ${content}`;
    console.log(line);
    if(this.logFile !== undefined){
      appendFileSync(this.logFile, line + '\n');
    }
  }
  error(content){
    this.writeLog(content, 'ERROR');
  }
  warning(content){
    this.writeLog(content, 'WARNING');
  }
  debug(content){
    this.writeLog(content, 'DEBUG');
  }
  log(content){
    this.writeLog(content, 'LOG');
  }
  info(content){
    this.writeLog(content, 'INFO');
  }
}

export const logger = new Logger();
