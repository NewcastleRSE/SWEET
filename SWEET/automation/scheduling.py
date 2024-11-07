from .sms import send_daily_reminder, send_monthly_reminder, send_sms_nudge
from .email import email_daily_reminder, email_monthly_reminder, send_profiler_reminder, send_goal_reminder, send_nudge
from datetime import datetime, timezone
import time
import json

from sched import scheduler
from threading import Thread, Event
from sentry_sdk import capture_message

from . import email, sms
from ..data.userdata import get_schedule

def _day():
    return datetime.today().astimezone().toordinal()

def _time():
    return datetime.now().astimezone().timestamp()

def _s_to_next_run():
    # naive implementation assumes that the next run is *tomorrow*, regardless of current time.
    # if run before 2am, will return > 24 hours.
    # if run just before midnight, will return just over 2 hours.
    # other scheudling logic should account for this naivety
    nextrun = datetime.fromordinal(_day()+1).astimezone().replace(hour=2)


    tdtonextrun = nextrun - datetime.now().astimezone()
    return max(0, tdtonextrun.total_seconds())

_lastrun = 0
_cancel = Event()
_sched = scheduler(timefunc=_time, delayfunc=time.sleep)
_running = []

def dailyschedule(today):

    items = get_schedule(today.date())

    # scheduler uses
    s = scheduler(timefunc=_time,delayfunc=time.sleep)

    for item in items:
        #determine correct action:
        # using firetext, we will send any SMS directly to firetext with a schedule, emails will be added to the daily schedule
        # if no time is specified use 08:00 as per team request

        if(item['type'].split('-')[0] == "nudge"):
            itemType = "nudge"
            nudgeType = item['type'].split('-')[1]
        else: 
            itemType = item['type']
            nudgeType = None  

        
        if item['method'] == "email":
            # set up clock time for item:
            if 'time' in item:
                hr, mn = item['time'].split(":")
            else:
                hr, mn = "08","00"

            item_ts = today.replace(hour=int(hr), minute=int(mn)).timestamp()
            item_action = {
                'daily': email_daily_reminder,
                'take': email_daily_reminder,
                'monthly': email_monthly_reminder,
                'order': email_monthly_reminder,
                'collect': email_monthly_reminder,
                'profiler-reminder': send_profiler_reminder,
                'profiler-due': send_profiler_reminder,
                'goal-reminder': send_goal_reminder,
                'nudge': send_nudge
             }[itemType]

            #set up appropriate arguments
            item['email'] = item['to']

            if itemType == "nudge":
                item_args = (item,nudgeType)
            else:
                item_args = (item,)
                
            item_kwargs = {} # currently no kwargs for emails.

            # if(item['to'] == 'mark.turner@ncl.ac.uk'):
            #     payload = {
            #         'action': item_action,
            #         'arguments': item_args,
            #         'timestamp': item_ts,
            #     }
            #     capture_message(json.dumps(payload, indent=4, sort_keys=True, default=str))

            #schedule email:
            s.enterabs(item_ts, 1, item_action, argument=item_args, kwargs=item_kwargs)
        else:
            item['mobile'] = item['to']
            # problem solving text message issue #499 - this message sent for Staging Kate and Linda
            payload = {
                'messageorigin': 'daily schedule item list not email',
                'item': item,
                'to': item['to'],
            }
            capture_message(json.dumps(payload, indent=4, sort_keys=True, default=str))
           
            if itemType == "nudge":
                send_sms_nudge(item, nudgeType, item.get('time', "08:00"))
            elif itemType == "daily" or itemType == "take":
                send_daily_reminder(item, item.get('time', "08:00"))
            else:
                #  todo add behaviour here for collect reminders
                send_monthly_reminder(item, item.get('time', '08:00'))

    # thread will exit when scheduler stops, i.e. when all the scheduled items have been run.
    t = Thread(target=s.run, name="daily")
    t.start()
    return s

def start():
    global _lastrun
  
    def trigger_daily():
        global _lastrun

        if _cancel.is_set():
            _cancel.clear()
            for e in _sched.queue:
                _sched.cancel(e)
            return

        today_ord = _day()

        if today_ord < _lastrun:
            _cancel.set()
            raise RuntimeError("ItsAllGoneWrongError") # how is today earlier than the last scheduled run?!

        if today_ord == _lastrun:
            # the schedule has already been run today (some form of scheduling fail?)
            # _s_to_next_run always returns the total seconds to 2am *tomorrow*,
            # so we don't need to do any complex calculation, just reschedule the trigger:
            _sched.enter(_s_to_next_run(),1,trigger_daily)
            
            return

        # it's at least 1 day since the last run: 
        # # create and start a daily schedule
        # # update the last run date.
        # # schedule a trigger event for tomorrow.
        _running.append(dailyschedule(datetime.today().astimezone()))
        _lastrun = today_ord
        _sched.enter(_s_to_next_run(),1,trigger_daily)
        


    if _lastrun < _day():
        # the schedule hasn't run today: run today's daily schedule immediately
        # disabled during initial testing to allow time for deletion of superfluous reminders
        #dailyschedule(datetime.today().date())
        _lastrun = _day()

    # schedule a daily trigger for "tomorrow"
    _sched.enter(_s_to_next_run(),1,trigger_daily)
    

    # run the schedule: 
    #   this will keep running until the schedule is empty:
    #   as the daily trigger adds itself to the schedule, it will keep running until
    #   cancelled with a stop() call, which causes the next scheduled trigger to abort early.
    t = Thread(target=_sched.run)
    t.start()
    

def stop():
    _cancel.set()
    for e in _sched.queue:
        _sched.cancel(e)

    for s in _running:
        for e in s.queue:
            s.cancel(e)

def running():
    operations = []
    for s in _running:
        if s.empty():
            _running.remove(s)
        else:
            operations.extend([f"{e.action.__name__} at {datetime.fromtimestamp(e.time)} for {e.argument[0]}" for e in s.queue])
    
    operations.extend([f"{e.action.__name__} at {datetime.fromtimestamp(e.time)}" for e in _sched.queue])
    return operations

def status():
    return "running" if len(_sched.queue) else "stopped"
