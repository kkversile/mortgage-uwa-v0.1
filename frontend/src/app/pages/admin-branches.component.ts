import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';

@Component({selector:'app-admin-branches',standalone:true,imports:[CommonModule],template:`
<div class="page-head"><div><div class="eyebrow">Administration</div><h1>Branches</h1><p>Review lender locations and their active operating status.</p></div><span class="status large" *ngIf="branches">{{branches.length}} branches</span></div>
<div class="metrics" *ngIf="branches"><div class="metric"><span>Branches</span><strong>{{branches.length}}</strong><small>Visible locations</small></div><div class="metric success"><span>Active</span><strong>{{activeCount}}</strong><small>Available for assignment</small></div><div class="metric"><span>Tenants</span><strong>{{tenantCount}}</strong><small>Lender workspaces</small></div></div>
<div class="card" *ngIf="branches"><div class="card-head"><div><h3>Branch directory</h3><p>Branch records are filtered by the authenticated administration workspace.</p></div></div><div class="table-wrap"><table><thead><tr><th>TENANT</th><th>BRANCH CODE</th><th>BRANCH NAME</th><th>LOCATION</th><th>STATUS</th></tr></thead><tbody><tr *ngFor="let branch of branches"><td><b>{{branch.tenant?.code}}</b><span class="table-sub">{{branch.tenant?.name}}</span></td><td><b>{{branch.code}}</b></td><td>{{branch.name}}</td><td>{{branch.city}}, {{branch.state}}</td><td><span class="status" [class.success-text]="branch.active">{{branch.active ? 'ACTIVE' : 'INACTIVE'}}</span></td></tr></tbody></table></div></div>
<div class="card empty" *ngIf="branches && !branches.length">No branches found.</div>`})
export class AdminBranchesComponent implements OnInit {
  branches:any[]|undefined;
  constructor(private api:ApiService){}
  ngOnInit(){this.api.adminBranches().subscribe({next:branches=>this.branches=branches,error:()=>this.branches=[]});}
  get activeCount(){return (this.branches||[]).filter(b=>b.active).length}
  get tenantCount(){return new Set((this.branches||[]).map(b=>b.tenantId)).size}
}
