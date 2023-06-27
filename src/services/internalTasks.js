import schedule from 'node-schedule';
import _throw from '#root/utils/_throw';
import notiController from '#root/controller/interaction/notification';
import authController from '#root/controller/user/auth';
import asyncWrapper from '#root/middleware/asyncWrapper';

const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 0;
rule.hour = 9;
rule.minute = 0;
rule.second = 0;
rule.tz = 'Asia/Saigon';

// Run internal task on Sunday, 9am
const internalTasks = asyncWrapper(async (req, res) =>
  schedule.scheduleJob(rule, async (req, res) => {
    console.log('start internal task');

    //delete outdated notification, inactive user account
    await Promise.all([notiController.delete, authController.delete]);
    console.log('end internal task');
  })
);

export default internalTasks;
