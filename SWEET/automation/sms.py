from ..secrets import firetext
from ..data.users import logvisit
import requests
from datetime import date

def _processResponse(text):
    code = int(text[:text.find(":")])
    message = text[text.find(" ")+1:]

    return code, message

def _send(to, msg, **kwargs):
    payload = {"apiKey": firetext['apikey'], "from": "HTandMe", "to": to, "message": msg}
    payload.update(kwargs) # for e.g. scheduled sending. for api parameters see https://www.firetext.co.uk/docs#sendingsms
    response = requests.post(firetext['endpoint'], params=payload)
    if response.status_code != 200:
        response.raise_for_status()
    else:
        code, message = _processResponse(response.text)
        if code == 0:
            return True, message
        else:
            return False, message
def send_sms_nudge(user, nudgeType, send_time):

    msg = ""

    if nudgeType == "2_week":
        f"Hello {user['firstName']}, making a plan for taking your hormone therapy means you are less likely to forget and it becomes part of your daily routine. You can make a plan in the Taking Hormone Therapy section of HT&Me. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "1_month":
        f"Hello {user['firstname']}, knowing how hormone therapy works can really help you understand why it is important to keep taking it every day. You can watch a video about hormone therapy on HT&Me – go to htandme.co.uk to find out more about how hormone therapy can help protect you from cancer coming back. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "2_month":
        f"Hello {user['firstname']}, the My Personal Support section of HT&Me can help you to find information and support relevant to you – whether it’s about how hormone therapy works, how to deal with any side-effects or how to talk about any concerns with a nurse. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "3_month":
        f"Hello {user['firstname']}, some women can have side-effects from their hormone therapy and these can change over time. Keeping a diary of any side-effects can help identify what makes them better or worse. This can make them more manageable. You can do this in the My Hormone Therapy Diary in HT&Me – go to htandme.co.uk to log any side-effects. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "4_month":
        f"Hello {user['firstname']}, having a routine for taking your hormone therapy makes it less likely you will forget it. The Taking Hormone Therapy section on HT&Me has hints and tips for how you could build taking it into your daily routine. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "5_month":
        f"Hello {user['firstname']}, remembering to order and collect your hormone therapy prescription can sometimes be hard. You can set prescription reminders in HT&Me – go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "6_month":
        f"Hello {user['firstname']}, although taking your hormone therapy is the most effective way of reducing the chance of breast cancer coming back, being active and having a healthy diet can help too. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "7_month":
        f"Hello {user['firstname']}, the My Personal Support section of HT&Me can help you to find information and support relevant to you – whether it’s about how hormone therapy works, how to deal with any side-effects or how to talk about any concerns with a health professional. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "8_month":
        f"Hello {user['firstname']}, talking to friends and family about your cancer and its treatment can sometimes be difficult. You can find hints and tips for talking to others in the Help and Support section of HT&Me. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "9_month":
        f"Hello {user['firstname']}, adjusting to life after cancer can raise many different emotions. The Healthy Living, Healthy Mind section of HT&Me includes hints and tips for dealing with difficult emotions. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "10_month":
        f"Hello {user['firstname']}, remember taking your hormone therapy every day is the best thing you can do to reduce the chance of your cancer coming back. HT&Me has information and support about how hormone therapy works and why taking it every day is so important. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "11_month":
        f"Hello {user['firstname']}, the My Personal Support section of HT&Me can help you to find information and support relevant to you – whether it’s about how hormone therapy works, how to deal with any side-effects or how to talk about any concerns with a nurse. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "12_month":
        f"Hello {user['firstname']}, You have now been part of the HT&Me study for one year. Your breast cancer team, GP and pharmacists can all support you with any issues relating to your hormone therapy. You can find advice on getting the best out of these conversations in the Help and Support section of HT&Me. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "13_month":
        f"Hello {user['firstname']}, online information about breast cancer can sometimes be overwhelming and it can be hard to know what to trust. HT&Me includes links to external websites which are trustworthy and reliable. You can also find links to Breast Cancer Now’s Patient Forum and Ask A Nurse resources. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "14_month":
        f"Hello {user['firstname']}, some women do not experience side-effects from hormone therapy, but others do. This can change over time - you may find that you are experiencing side-effects now that you were not before. You can find advice for managing these in the Dealing with Side-effects section of HT&Me. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "15_month":
        f"Hello {user['firstname']}, sometimes hearing from other women in a similar situation can be helpful. HT&Me includes quotes and stories from women taking hormone therapy sharing tips of what has worked for them. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "16_month":
        f"Hello {user['firstname']}, being more active every day will help you live a healthier life and may help reduce any side-effects of hormone therapy. The Healthy Living, Healthy Mind section of HT&Me includes tips and examples of exercises appropriate for a range of fitness levels. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "17_month":
        f"Hello {user['firstname']}, the My Personal Support section of HT&Me can help you to find information and support relevant to you – whether it’s about how hormone therapy works, how to deal with any side-effects or how to talk about any concerns with a nurse. Go to htandme.co.uk to find out more. If you have any problems accessing HT&Me please contact htandmesupport@warwick.ac.uk. The HT&Me Team PLEASE DO NOT REPLY"
    elif nudgeType == "18_month":
        f"Hello {user['firstname']}, it has been 18 months since you were introduced to the HT&Me support package. Although you are coming to the end of your time in the SWEET Study, you will still have access to HT&Me. If you have any issues or concerns with taking your hormone therapy, you can still reach out to your breast cancer team or GP for support. Remember taking your hormone therapy every day is the single best thing you can do to prevent your cancer coming back. The HT&Me Team PLEASE DO NOT REPLY"

    logvisit(user, "scheduler_sms", action="send_sms_nudge")
    return _send(user['mobile'], msg, schedule=f"{date.today().isoformat()} {send_time}")

def send_daily_reminder(user, send_time):
    msg = f"Hi {user['firstName']}, remember your hormone therapy today."
    logvisit(user, "scheduler_sms", action="send_daily_reminder")
    return _send(user['mobile'], msg, schedule=f"{date.today().isoformat()} {send_time}")

def send_monthly_reminder(user, send_time):
    msg = f"Hi {user['firstName']}, this is a reminder to order your next hormone therapy prescription."
    logvisit(user, "scheduler_sms", action="send_monthly_reminder")
    return _send(user['mobile'], msg, schedule=f"{date.today().isoformat()} {send_time}")


