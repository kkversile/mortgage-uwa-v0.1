import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';

@Component({selector:'app-admin-users',standalone:true,imports:[CommonModule],template:`
<div class="page-head"><div><div class="eyebrow">Administration</div><h1>Users & memberships</h1><p>Review active identities and the tenant roles they hold.</p></div><span class="status large" *ngIf="users">{{users.length}} users</span></div>
<div class="metrics" *ngIf="users"><div class="metric"><span>Users</span><strong>{{users.length}}</strong><small>Active identities</small></div><div class="metric"><span>Memberships</span><strong>{{membershipCount}}</strong><small>Tenant assignments</small></div><div class="metric"><span>Roles</span><strong>{{roleCount}}</strong><small>Distinct assigned roles</small></div></div>
<div class="card" *ngIf="users"><div class="card-head"><div><h3>Active users</h3><p>Memberships are scoped to the authenticated administration workspace.</p></div></div><div class="table-wrap"><table><thead><tr><th>USER</th><th>ACCOUNT TYPE</th><th>TENANT</th><th>ROLE</th><th>BRANCH</th><th>STATUS</th></tr></thead><tbody><ng-container *ngFor="let user of users"><tr *ngFor="let membership of user.memberships"><td><b>{{user.displayName}}</b><span class="table-sub">{{user.email}}</span></td><td>{{pretty(user.accountType)}}</td><td>{{membership.tenant?.code}}<span class="table-sub">{{membership.tenant?.name}}</span></td><td><span class="status">{{pretty(membership.role)}}</span></td><td>{{membership.branch?.code || 'All branches'}}<span class="table-sub">{{membership.branch?.name}}</span></td><td><span class="status success-text">{{user.active && membership.active ? 'ACTIVE' : 'INACTIVE'}}</span></td></tr></ng-container></tbody></table></div></div>
<div class="card empty" *ngIf="users && !membershipCount">No active memberships found.</div>`})
export class AdminUsersComponent implements OnInit {
  users:any[]|undefined;
  constructor(private api:ApiService){}
  ngOnInit(){this.api.adminUsers().subscribe({next:users=>this.users=users,error:()=>this.users=[]});}
  get membershipCount(){return (this.users||[]).reduce((n,u)=>n+(u.memberships?.length||0),0)}
  get roleCount(){return new Set((this.users||[]).flatMap(u=>(u.memberships||[]).map((m:any)=>m.role))).size}
  pretty(value:string){return value?.replaceAll('_',' ')||''}
}
