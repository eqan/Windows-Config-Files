"use strict";(self.webpackChunkbardeen_browser_extension=self.webpackChunkbardeen_browser_extension||[]).push([[9490],{89490:(e,t,n)=>{n.r(t),n.d(t,{default:()=>s});var o=n(91896);class s extends o.UIModulePage{constructor(){super(...arguments),this.handleCopy=e=>{const t=document.getSelection();t&&this.controller.onCopyText("text",t.toString())},this.handlePaste=e=>{if(e.clipboardData){const t=e.clipboardData.getData("text");t&&this.controller.onPasteText("text",t)}},this.handleClick=e=>{if(e.target instanceof HTMLElement){let t=e.target.innerText.trim().toLowerCase();t||(t=e.target.title),t||(t=e.target.getAttribute("alt")),t&&this.controller.onButtonClick(t)}}}async unmount(){document.removeEventListener("copy",this.handleCopy,!0),document.removeEventListener("paste",this.handlePaste,!0),document.removeEventListener("click",this.handleClick,!0)}async mount(){document.addEventListener("copy",this.handleCopy,!0),document.addEventListener("paste",this.handlePaste,!0),document.addEventListener("click",this.handleClick,!0)}}}}]);