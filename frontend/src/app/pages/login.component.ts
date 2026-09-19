import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth.service';
@Component({selector:'app-login',standalone:true,imports:[CommonModule,FormsModule],template:`
<div class="login-page"><div class="login-card">
  <div class="brand-mark">MU</div><h1>Mortgage UWA</h1><p class="subtle">Underwriting Assistant · Portfolio Environment</p>
  <div class="demo-banner">Synthetic data only · Not for real lending decisions</div>
  <div class="portal-switch"><button type="button" [class.active]="portal==='consumer'" (click)="selectPortal('consumer')">Borrower / Consumer</button><button type="button" [class.active]="portal==='operations'" (click)="selectPortal('operations')">Lending Operations</button><button type="button" [class.active]="portal==='admin'" (click)="selectPortal('admin')">Tenant Administration</button></div>
  <label>Email</label><input [(ngModel)]="email" type="email">
  <label>Password</label><input [(ngModel)]="password" type="password" (keyup.enter)="submit()">
  <button class="btn primary full" (click)="submit()" [disabled]="loading">{{loading?'Signing in…':'Sign in'}}</button>
  <div *ngIf="error" class="error">{{error}}</div>
  <div class="demo-creds"><b>Demo:</b> underwriter&#64;mortgage-uwa.local / Mortgage&#64;123</div>
</div></div>`})
export class LoginComponent{
 email='underwriter@mortgage-uwa.local';password='Mortgage@123';loading=false;error='';portal='operations';
 constructor(private auth:AuthService,private router:Router,route:ActivatedRoute){const segment=route.snapshot.url[0]?.path;if(segment==='consumer')this.portal='consumer';if(segment==='admin'){this.portal='admin';this.email='admin@mortgage-uwa.local';}if(this.portal==='consumer')this.email='consumer@mortgage-uwa.local';}
 selectPortal(portal:'consumer'|'operations'|'admin'){this.portal=portal;this.email=portal==='consumer'?'consumer@mortgage-uwa.local':portal==='admin'?'admin@mortgage-uwa.local':'underwriter@mortgage-uwa.local';this.password='Mortgage@123';this.error='';}
 submit(){this.loading=true;this.error='';this.auth.login(this.email,this.password,this.portal).subscribe({next:()=>this.router.navigateByUrl(this.portal==='consumer'?'/consumer/dashboard':this.portal==='admin'?'/admin/overview':'/operations/dashboard'),error:e=>{this.loading=false;this.error=e?.error?.message||'Login failed';}});}
}
