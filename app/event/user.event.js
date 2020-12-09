import EventEmitter from 'events';
import md5 from 'md5';
import {eventLog} from "../config/winston";
import db from '../db/models';
import * as emailService from '../service/email/email.service';



export const USER_EVENT = Object.freeze({
  REGISTER: 'user:register'
});
export const userEmitter = new EventEmitter();

function emailRegister(user) {
  try {
    const token = md5(`${user.email}-${new Date()}`);
    const url = `${process.env.WEB_URL || 'http://php.local:3000'}/email-activate?email=${user.email}&token=${token}`;
    eventLog.info(`Build url: ${url}`);
    db.UserActivate.create({
      user_id: user.id,
      active_code: token,
      date_inserted: new Date()
    })
      .then(async () => {
        await emailService.sendRegister(user.email, user.displayName, url);
      })
      .catch((reason) => {
        eventLog.error(reason);
      });
  } catch (e) {
    eventLog.error(e);
  }
}

userEmitter.on(USER_EVENT.REGISTER, (user) => {
  eventLog.info(`Event user:register ${JSON.stringify(user)}`);
  setImmediate(async () => {
    emailRegister(user);
  });
});
