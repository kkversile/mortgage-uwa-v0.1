import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';
@Component({selector:'app-rules',standalone:true,imports:[CommonModule],template:`
<div class="page-head"><div><div class="eyebrow">Policy</div><h1>Underwriting rules</h1><p>Versioned demonstration thresholds. These are not real lender policies.</p></div></div><div class="demo-banner wide">DEMO POLICY · Synthetic thresholds for software architecture demonstration only.</div><div class="rule-grid"><div class="card rule-card" *ngFor="let r of rules"><div class="eyebrow">{{r.version}}</div><h3>{{r.name}}</h3><p>{{r.code.replaceAll('_',' ')}}</p><div class="threshold"><span>Approve threshold</span><b>{{r.approveThreshold}}</b></div><div class="threshold"><span>Review threshold</span><b>{{r.reviewThreshold}}</b></div><span class="status">{{r.enabled?'ACTIVE':'DISABLED'}}</span></div></div>`})
export class RulesComponent implements OnInit{rules:any[]=[];constructor(private api:ApiService){}ngOnInit(){this.api.rules().subscribe(r=>this.rules=r)}}
