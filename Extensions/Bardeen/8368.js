"use strict";(self.webpackChunkbardeen_browser_extension=self.webpackChunkbardeen_browser_extension||[]).push([[8368],{8368:(e,t,n)=>{n.r(t),n.d(t,{useStyles:()=>u,default:()=>p});var a=n(2784),o=n(91896),i=n(85795),s=n(6277),r=n(28316);const l=({api:e,pbs:t,openBuilderOnRun:n})=>{const[o,r]=a.useState(!1),[l,p]=a.useState([]),c=u();if(a.useEffect((()=>{let e=!1;return async function(){e||p(t)}(),()=>{e=!0}}),[t]),!l.length||o)return null;const d=()=>{r(!0)},y=async t=>{await e.playbookSetFavorite(t.id,!t.favorite,!0),p(l.map((e=>e.id===t.id?{...e,favorite:!e.favorite}:e)))},k=async t=>{await e.trackEvent({name:"notification.control",properties:{action:t}})},b=async({id:t})=>{n?(d(),await e.playbookEditorSynthesize()):(d(),await e.trackEvent({name:"notification.playbook.run",properties:{id:t}}),await e.playLinkEvaluate(`https://play.bardeen.ai/playbook/${t}`))},f=async t=>{n?(d(),e.playbookNagPatternExclude(t)):(await e.playbookDislike(t.id),p(l.filter((e=>e!==t))))};return a.createElement("div",{className:(0,s.Z)(c.nag)},n?a.createElement(i.BuilderNag,{hideAfterMs:15e3,onClose:d,onDislike:f,onPin:y,onRun:b,onControl:k,playbook:l[0]}):a.createElement(i.Nag,{hideAfterMs:15e3,onClose:d,onDislike:f,onPin:y,onRun:b,onControl:k,playbooks:l}))},u=(0,i.makeStyles)({nag:{position:"fixed",top:"1rem",right:"1rem",zIndex:2147483e3}}),p=class extends o.UIModulePage{async mount(e){var t;const{wantsPlaybookSuggestions:n}=await this.api.systemSettingsGet();if(!n)return;const o=await this.api.playbookNagSuggestions();if(0===o.length)return;const s=1===o.length&&"PatternMatcher"===(null===(t=o[0])||void 0===t?void 0:t.origin);s&&this.api.playbookNagReset(),r.render(a.createElement(i.BardeenStyleProvider,null,a.createElement(l,{api:this.api,pbs:o,openBuilderOnRun:s})),e)}async unmount(e){r.unmountComponentAtNode(e)}}}}]);