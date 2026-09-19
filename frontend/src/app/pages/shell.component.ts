import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
@Component({selector:'app-shell',standalone:true,imports:[CommonModule,RouterOutlet,RouterLink,RouterLinkActive],template:`
<div class="app-shell">
<aside class="sidebar"><div class="logo-row"><div class="brand-mark small">MU</div><div><b>Mortgage UWA</b><span>Underwriting Assistant</span></div></div>
<nav><a routerLink="/dashboard" routerLinkActive="active">Overview</a><a routerLink="/applications" routerLinkActive="active">Applications</a><a routerLink="/rules" routerLinkActive="active">Policy Rules</a></nav>
<div class="sidebar-foot"><span class="pill">PORTFOLIO DEMO</span><button class="link-btn" (click)="auth.logout()">Sign out</button></div></aside>
<main class="main"><header class="topbar"><div><div class="eyebrow">Mortgage Operations</div><h2>Underwriting Workspace</h2></div><div class="user-chip"><div class="avatar">{{initials}}</div><div><b>{{auth.user()?.displayName}}</b><span>{{auth.user()?.role}}</span></div></div></header><section class="content"><router-outlet></router-outlet></section></main>
</div>`})
export class ShellComponent{constructor(public auth:AuthService){} get initials(){return (this.auth.user()?.displayName||'U').split(' ').map(x=>x[0]).slice(0,2).join('');}}
