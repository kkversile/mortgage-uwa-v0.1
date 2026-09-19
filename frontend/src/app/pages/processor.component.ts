import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({selector:'app-processor',standalone:true,imports:[CommonModule,RouterLink],template:`
<div class="page-head"><div><div class="eyebrow">Loan processing</div><h1>Processor queue</h1><p>Review missing documents, verification status, and assigned applications.</p></div></div>
<div class="metrics"><div class="metric"><span>Assigned loans</span><strong>{{apps.length}}</strong><small>Current lender workspace</small></div><div class="metric warning"><span>Pending documents</span><strong>{{pending}}</strong><small>Needs follow-up</small></div><div class="metric success"><span>Verified documents</span><strong>{{verified}}</strong><small>Ready for review</small></div></div>
<div class="card"><div class="table-wrap"><table><thead><tr><th>Application</th><th>Borrower</th><th>Loan product</th><th>Documents</th><th>Status</th><th></th></tr></thead><tbody><tr *ngFor="let a of apps"><td><b>{{a.applicationNumber}}</b><span class="table-sub">SLA: {{a.status==='APPLICATION_STARTED'?'New':'On track'}}</span></td><td>{{a.applicant?.firstName}} {{a.applicant?.lastName}}</td><td>Conventional demo</td><td>{{a.documents?.length||0}} uploaded</td><td><span class="status">{{pretty(a.status)}}</span></td><td><a [routerLink]="['/operations/applications',a.id]">Open →</a></td></tr></tbody></table></div></div>`})
export class ProcessorComponent implements OnInit {apps:any[]=[];constructor(private api:ApiService){}ngOnInit(){this.api.applications().subscribe(a=>this.apps=a)}get pending(){return this.apps.filter(a=>['APPLICATION_STARTED','DOCUMENTS_PENDING','DOCUMENT_PROCESSING'].includes(a.status)).length}get verified(){return this.apps.reduce((n,a)=>n+(a.documents?.filter((d:any)=>d.status==='VERIFIED').length||0),0)}pretty(s:string){return s?.replaceAll('_',' ')||''}}
