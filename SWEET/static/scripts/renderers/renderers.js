import { accordionRenderer } from "./accordion.js";
import { alertRenderer } from "./alert.js";
import { blockquoteRenderer } from "./blockquote.js";
import { carouselRenderer, carouselSlideRenderer } from "./carousel.js";
import { contactRenderer, contactFormRenderer, contactListRenderer, contactPageRenderer } from "./contacts.js";
import { favouritePageRenderer } from "./favourites.js";
import { indexListRenderer } from "./indexlist.js";
import { diaryCalendarRenderer, diaryGraphRenderer } from "./diary-page.js";
import { embedRenderer } from "./embed.js";
import { fillInBoxRenderer } from "./fillin.js";
import { goalRenderer } from "./goal.js";
import { goalCheckerRenderer } from "./goalchecker.js";
import { homepageMenuRenderer } from "./home_page.js";
import { markdownRenderer } from "./markdown.js";
import { menuRenderer, menuItemRenderer, describedMenuRenderer, describedMenuItemRenderer } from "./menu.js";
import { planRenderer, myPlansRenderer } from "./plan.js";
import { popupRenderer, popupTriggerRenderer } from "./popup.js";
import { profilerModalRenderer, profilerResultRenderer, profilerLauncherRenderer, myPersonalSupportRenderer } from "./profiler.js";
import { reminderRenderer } from "./remindersetter.js";
import { sideEffectModalRenderer, sideEffectFormRenderer } from "./side_effects.js";
import { splashImageRenderer } from "./splashimage.js";
import { thoughtsRenderer, thoughtsPageRenderer } from "./thoughts.js";
import { tiledResourcesRenderer } from "./tiledresources.js";
import  { userDetailsPageRenderer } from "./user_details.js";
import { welcomeFooterRenderer } from "./welcome.js";

export const renderers = {
    markdown: markdownRenderer,
    external: embedRenderer,
    popup: popupRenderer,
    "popup-trigger": popupTriggerRenderer,
    "block-quote": blockquoteRenderer,
    standout: alertRenderer,
    goalsetter: goalRenderer,
    accordion: accordionRenderer,
    menu: menuRenderer,
    "menu-item": menuItemRenderer,
    'homepage-menu': homepageMenuRenderer,
    sideeffect: sideEffectModalRenderer,
    sideeffectform: sideEffectFormRenderer,
    profiler: profilerModalRenderer,
    "diary-calendar": diaryCalendarRenderer,
    fillin: fillInBoxRenderer,
    reminders: reminderRenderer,
    diarygraph: diaryGraphRenderer,
    "described-menu": describedMenuRenderer,
    "described-menu-item": describedMenuItemRenderer,
    "user-details-page": userDetailsPageRenderer,
    "contact": contactRenderer,
    "contact-form": contactFormRenderer,
    "contact-list": contactListRenderer,
    "contacts-page": contactPageRenderer,
    "favourites-page": favouritePageRenderer,
    "index-list": indexListRenderer,
    "plan": planRenderer,
    "my-plans": myPlansRenderer,
    "thoughts": thoughtsRenderer,
    "thoughts-page": thoughtsPageRenderer,
    "welcome-footer": welcomeFooterRenderer,
    "profiler-result": profilerResultRenderer,
    "profiler-launcher": profilerLauncherRenderer,
    "my-personal-support": myPersonalSupportRenderer,
    goalchecker: goalCheckerRenderer,
    carousel: carouselRenderer,
    "carousel-slide": carouselSlideRenderer,
    splashimage: splashImageRenderer,
    tiledresources: tiledResourcesRenderer
}