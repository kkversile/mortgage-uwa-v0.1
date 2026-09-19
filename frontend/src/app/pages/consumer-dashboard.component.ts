import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({selector:'app-consumer-dashboard',standalone:true,imports:[CommonModule,RouterLink],template:`
<div class="page-head"><div><div class="eyebrow">My mortgage</div><h1>Welcome back</h1><p>Track your application and complete the next step when you are ready.</p></div></div>
<div *ngIf="app" class="card consumer-hero"><div><span class="eyebrow">{{app.applicationNumber}}</span><h2>{{app.applicant?.firstName}} {{app.applicant?.lastName}}</h2><p>Current status: <b>{{pretty(app.status)}}</b></p></div><a class="btn primary" routerLink="/consumer/application">Open application</a></div>
<div class="summary-grid consumer-progress"><div class="summary-card"><span>Application</span><strong>Started</strong><small>Details saved</small></div><div class="summary-card"><span>Documents</span><strong>{{app?.documents?.length||0}}</strong><small>Uploaded documents</small></div><div class="summary-card"><span>Credit authorization</span><strong>Pending</strong><small>Provider check follows submission</small></div><div class="summary-card"><span>Closing</span><strong>Not started</strong><small>We will guide you later</small></div></div>
<div class="card next-action"><div class="card-head"><div><h3>Next action</h3><p>Complete the application sections and upload requested documents.</p></div><a class="btn" routerLink="/consumer/application">Continue</a></div></div>`})
export class ConsumerDashboardComponent implements OnInit { app:any; constructor(private api:ApiService){} ngOnInit(){this.api.applications().subscribe(a=>{this.app=a[0]})} pretty(s:string){return s?.replaceAll('_',' ')||''} }
