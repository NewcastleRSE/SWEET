import random
from .az_persitent import AzurePersitentDict
from ..secrets import connstr as az_connection, datasource as az_content_cntr, structure, content, resources

from . import recursiveUpdate

__structure = AzurePersitentDict(az_connection, az_content_cntr, structure)
__content = AzurePersitentDict(az_connection, az_content_cntr, content)
__resources = AzurePersitentDict(az_connection, az_content_cntr, resources)

# content and structure
def getStructure():
    return __structure

def updateStructure(newStructure):
    recursiveUpdate(__structure, newStructure)
    __structure.commit()

def getPageDetails(path):
    struct = __structure

    for slug in path[1:].split("/"):
        if slug in struct:
            struct = struct[slug]
        else:
            try:
                struct = next(i for i in struct['pages'] if i['slug'] == slug)
            except StopIteration:
                return None

    # need to return a copy of the information to avoid contaminating the underlying data
    output = { "title": struct['title'], "slug": struct['slug']}

    if 'headerImage' in struct:
        output['headerImage'] = struct['headerImage']
    if 'pages' in struct:
        output['pages'] = [{"slug": p['slug'], 'title': p['title']} for p in struct['pages']]

    return output

def getPages():
    return __content

def getPageContents(path):
    return __content.get(path, "")

def updatePageContent(details):
    __content[details["path"]] = details["content"]
    __content.commit()

    #check for structure updates:
    if "title" in details or "headerImage" in details:
        struct = __structure
        slugs = details["path"][1:].split("/")
        for slug in slugs:
            if slug in struct:
                struct = struct[slug]
            else:
                struct = next(i for i in struct['pages'] if i['slug'] == slug)
        
        if "title" in details:
            struct['title'] = details['title']

        if "headerImage" in details:
            struct['headerImage'] = details['headerImage']

        __structure.commit()

def getResources():
    return { 
        k: { 'name': k, 'description': v['description'], 'caption': v.get("caption", ""), 'source': v['source'] if 'source' in v else 'none' }
        for k,v in __resources.items()
    }
        
def getResource(name):
    if name in __resources:
        r = __resources[name]
        output = { "name": name, "description": r['description'], "caption": r.get('caption', "")}

        if 'content-type' in r:
            output['content-type'] = r['content-type']
        else:
            if 'source' in r and r['source'].startswith("data:"):
                output['content-type'] = r['source'][5:r['source'].find(';')]
            else:
                return None

        if 'source' in r:
            output['source'] = r['source']
        else:
            output['source'] = "useblob"

        return output
    
    return None

def getResourceBlob(name):
    if name not in __resources:
        return None

    r = __resources[name]

    if 'blob' not in r:
        return None

    from io import BytesIO
    from base64 import b64decode

    f = BytesIO(b64decode(r['blob'].encode('utf8')))
    t = r['content-type']
    n = r['filename']

    return {'name': name, 'file': f, 'content-type': t, 'downloadName': n }

def saveResource(newres):
    name = newres['name']

    if name in __resources:
        del newres['name']
        __resources[name].update(newres)
        return
    
    input = { 'description': newres['description'], 'content-type': newres['content-type'], 'filename': newres['filename'], 'caption': newres.get('caption', "") }
    if 'source' in newres:
        input['source'] = newres['source']

    if 'blob' in newres:
        input['blob'] = newres['blob']

    __resources[name] = input
    __resources.commit()

def getGoalMessage(goal, which):
    messages = {
        "activity": {
            'y': [
                "Congratulations on meeting your goals!  How did it go for you?\n\nFor next week, why not try keeping up the same activity but adding in something new – have a look through the website for more ideas on how to get active. \n\nRemember that the more you’re active, the better it is for your health.",
                "Well done on meeting your goals!\n\nYou’ve completed last week’s challenge with flying colours – congratulations.  How about making things a little harder for yourself next week?\n\nWhy not set a challenge to be active for longer each day?",
                "Congratulations on hitting your goal!\n\nYou’ve achieved everything you set out to do last week. Well done! If you feel up to it why not try a new goal next week to challenge yourself?\n\nRemember the more you do, the more benefits you will see, like increasing your energy levels.",
                "Congratulations on hitting your goal this week.\n\nWhy not try building on this success and add in some more activity next week? Just adding in an extra 5 to 10 minutes can help you sleep better and improve your mood.",
                "Well done!\n\nYou’re on a roll. Remember, the more you do the bigger the benefits; such as boosting your mood, improving your sleep and giving you more energy. \n\nKeep it up!",
                "That’s great news, well done!\n\nAdding more physical activity to your week will help boost your immune system and improve your memory.\n\nAnd the great news is, the more you do, the bigger the benefits. If you need some inspiration, you can always have another look for ideas in the Being Active section.",
                "Keep it up!\n\nIf you’ve found a level of physical activity that really works for you then stick with it. Being active will soon become a habit!\n\nOr if you want to try something new, try taking another look at the suggestions on the website. There are loads of ways you can add more activity into your day."
                ],
            'p': [
                "It’s good to see that you are making some progress with your goals.\n\nIt's important not to worry about the goals you didn’t meet, just keep going and think about making a plan that works for you.\n\nYou are on the right track and with a little push you’ll be meeting all of your goals in no time.",
                "Many people find it tricky to meet all of their goals when trying to do new things like physical activity so well done for meeting some of your goals this week.\n\nYou may wish to keep your goals the same for next week or if you are finding some of the activities hard to fit in then you might want to try a different activity next week.\n\nYou can always have another look on the Being Active section for ideas.",
                "Great work! Being active even a little bit more is going to benefit your health. \n\nEveryone has weeks like this. If you are finding any of your goals hard to meet you can always change them so that they fit better with your daily routine.\n\nKeep making progress by doing a little more each week and in no time being active will become a habit of yours!",
                "You’ve made a great progress on your goals this week. Keep going and you’ll be hitting your target in no time!\n\nThis week maybe have a think about new ways you could add just a bit more activity to your routine each day. Just adding 5 to 10 minutes can make a big difference. Maybe try adding in some more walking by doing some housework, or going for a stroll at lunch time?",
                "Well done! It’s great that you are making progress towards hitting your goals.\n\nThe good news is that every bit you do is good for you, and the more you do, the bigger the benefits!\n\nSo keep up with what you’re doing and have a think about ways you can fit in those last bits of activity into your week. Have another look at the website for loads of different ideas.",
                "Small changes can make a big difference, so well done on meeting some of your activity goals this week.\n\nKeep building on this success by adding just a few minutes of activity to your routine each day and you’ll be hitting all of your goals in no time! If you need some new ideas why not try having another look at the activities on the website?"
            ],
            'n': [
                "Well done on setting some goals last week – whilst you didn’t meet your goals, you still took a big step in the right direction.\n\nHow did the week go?  Did it feel like you couldn’t fit more activity into your daily life?\n\nYou might want to try a smaller goal this week and build up over time.\n\nHave a look back through our website for ideas.  Remember that even 10 minutes walking a day is good for your lungs, heart and bones!",
                "It looks like you didn’t meet your goal for this week.  That’s ok, we all have good days and bad days where things don’t work out.  Perhaps another goal would suit you better?\n\nWhy not have a look at the ideas on the website and see if something else works for you.\n\nA lot of this is trial and error – trying new things until you find something that fits into your routine and is easy and enjoyable to do.\n\nKeep trying things a bit at a time and you’ll get there!  ",
                "It looks like you have been finding it hard to fit activity into your daily routine.\n\nThat’s to be expected – when we try new ideas or routines, it takes time to get used to it.  Don’t give up!\n\nWith physical activity, the best news is that every bit you do is good for you. You can have bad days and still make a difference by going for a walk at lunchtime when you’re feeling better.  Why not try a new goal this week that fits in with what you’re already doing?",
                "Haven’t been able to fit in much activity this week? Don’t worry, we all have good weeks and bad weeks.\n\nWhen getting active, every bit you do is good for you. Why not try a new goal this week that fits in with what you’re already doing? Just adding 5 or 10 minutes more can make a big difference, and you can build up from there!",
                "Was your last goal not right for you?\n\nMaybe this week you could try something different?\n\nWhy not try something simple like adding just 5 to 10 minutes walking to your routine each day? Experts say that walking is the nearest activity to perfect exercise.\n\nThere are loads of easy ways to add more walking into your day. Maybe try going for a stroll at lunch time, walking around the room while watching TV or walking around the garden for a couple of minutes after dinner. ",
                "Want to try something different?\n\nIf last week’s goal wasn’t right for you, why not have a go at something else?\n\nThere are loads of ways you can add in activity right at home! There’s no need to go anywhere! Doing little jobs around the house is a great way to get active, and if the weather is nice, try getting out in the garden. Or if you don’t fancy doing chores, try dancing to some uplifting music.",
            ]
        },
        "eating": {
            "y": [
                "Fantastic! Small changes are easier to stick with, and over time can make a real difference to your health. Could you try to start small at first and then slowly increase your level of challenge?",
                "Good work! As you are doing so well, maybe this week you could try to set goals that will be a little more challenging? By slowly increasing the healthy changes you make to what you eat, you’ll soon notice more benefits.",
                "Well done. Did you know that by eating more healthily you are helping to lower your risk of diseases, like heart disease, type 2 diabetes, or high blood pressure. You may also gain some other benefits, such as healthy skin and hair. Keep up the good work!",
                "You’re doing really well! Did you know that research shows that the more healthy eating choices you make (e.g., eating more fruit and vegetables and wholegrain foods, and less red and processed meat), the more likely you are to have health benefits, such as better protection against cancer, depression, and dementia. Are there any ways that you can challenge yourself to eat even more healthily this week?",
                "It’s great that you’re sticking to your goals. Eating more healthily can boost your energy and might even help to improve your mood. Soon you may find yourself feeling better and having more energy for your everyday tasks. Keep going with your healthy eating and you may soon see even more benefits!",
                "Great job! By trying so hard to eat more healthily you may soon find that you have more energy and you are feeling happier. Keep up the good work.",
                "You’ve nailed it! You are eating more healthily, which will soon help you to see the benefits! Research suggests that healthy eating helps to keep your immune system strong. A stronger immune system gives you more protection against every day illnesses like colds and flu, and also against major diseases.",
            ],
            "p": [
                "Good! Start small and then slowly increase changes you make to your food choices. This will help you to stay on track with your healthy eating goals and gain great health benefits. Can you think of something you could do next week to meet all of your goals?",
                "It’s good that you have met some of your goals. Try to remember exactly what you did to meet these goals. Did you follow your plan? Can you do that again this week? Is there anything else that you could do to meet more of your eating goals next week?",
                "You’ve done well. Keep in mind that even small changes to your eating can make a big difference over time. The more you focus on meeting your eating goals, the healthier your eating will become. Could you challenge yourself to meet all of your eating goals next week?",
                "Well done. Eating more healthily can help to make you feel better, improve your health, and make you feel more confident. What could you do next week to help you meet all of your goals?",
                "This is good. Try to remember times when you ate more healthily this week and think about how you could do this again next week. What else could you try to make sure you meet all of your eating goals next week?",
                "Great, you’ve had some success. Did you know that eating more healthy foods can help you overcome tiredness and can give you boost of energy? Keep pushing yourself to meet your goals and you’ll soon see some benefits.",
                "You’ve done well. Research suggests that the more healthy eating choices you make, the more benefits you will see. Have a think about what went well last week – when you ate healthily – and try to repeat that next week. Could you make any other healthy changes in your eating to help meet all of your goals next week?",
            ],
            "n": [
                "Don’t worry, everyone has weeks like this. Have a think about what else you could do to make your goals work for you. Would it help to cut down on buying unhealthy foods and instead buy healthier foods? You could also think about how to make your meals healthier. Could you add an extra portion of vegetables to your dinner? Could you cut down on takeaways? Have a think and make a detailed plan about how to achieve your goals next week. ",
                "That’s okay, now let’s think about what could be done differently next week. People who set goals that they can achieve are more likely to make healthier eating habits. That’s why it is important to decide which goals are not working for you. Sometimes the problem is that goals are unrealistic and need to be changed. Other times the goals are realistic but you need to make a more realistic plan of how you can stick to them. Have a think about anything you could do to make sure you meet your goals next week.",
                "Don’t worry, everyone has weeks like this. Eating healthily doesn’t need to be an extreme challenge. Many people start eating healthily by making small changes in the way they eat. For example, they might swap some less healthy foods with healthier options (e.g., snacking on grapes, carrot, or nuts, instead of crisps, biscuits, or chocolate more often). Could you swap some of the unhealthy foods with healthier ones next week?",
                "Some weeks it is hard to stick to your goals. Do you think that your goals were right for you? Sometimes it is better to start with small changes and build up slowly. Perhaps you could start with goals that you think might be easier to meet and then choose more challenging ones once you have met these.",
                "That’s fine, sometimes it is difficult to stick to your goals. Maybe you could rethink the goals you set before? Perhaps next week you could try to think about what you eat between meals. Are there unhealthy snacks that you could cut down on? Swapping some of your less healthy snacks with healthier ones can be a good way to do this.  For example, snacking on carrot sticks, grapes, or berries, instead of crisps, biscuits, or chocolate could help to meet your goals next week!",
                "Eating more healthily doesn’t have to be boring. You might like to find tasty and healthier alternatives to some of the less healthy foods you eat. There are so many tasty and healthy recipes out there! ",
                "That’s okay. Making healthier eating choices can be difficult at times as it might feel like you have to give up some of your favourite foods. However, you can eat more healthily and enjoy it! You don’t need to give up your favourite foods completely – you might just need to eat them less often. You can find ideas about meals to cook that will be healthier and also tasty. ",
            ]
        }
    }

    msglist = messages[goal['goaltype']][goal['outcome']]
    message = msglist[which]
    index = 0 if which+1 == len(msglist) else which+1

    return message, index