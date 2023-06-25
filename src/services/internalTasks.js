import schedule from 'node-schedule';
import _throw from '#root/utils/_throw';
import notiController from '#root/controller/interaction/notification';
import asyncWrapper from '#root/middleware/asyncWrapper';

const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 0;
rule.hour = 9;
rule.minute = 0;
rule.second = 10;
rule.tz = 'Asia/Saigon';

const internalTasks = asyncWrapper(async (req, res) =>
  schedule.scheduleJob(rule, async (req, res) => {
    console.log('start internal task');
    await notiController.delete;
    console.log('end internal task');
  })
);

export default internalTasks;
