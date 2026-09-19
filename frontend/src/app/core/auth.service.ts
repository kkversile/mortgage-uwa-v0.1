import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { LoginResponse, User } from '../models';
import { API_BASE_URL } from './app-config';
@Injectable({providedIn:'root'})
export class AuthService {
  private readonly base = API_BASE_URL;
  constructor(private http:HttpClient, private router:Router){}
  login(email:string,password:string,portal?:string){ return this.http.post<LoginResponse>(`${this.base}/auth/login`,{email,password,portal}).pipe(tap(r=>{localStorage.setItem('mua_token',r.accessToken);localStorage.setItem('mua_user',JSON.stringify(r.user));})); }
  logout(){ localStorage.removeItem('mua_token'); localStorage.removeItem('mua_user'); this.router.navigateByUrl('/login'); }
  token(){return localStorage.getItem('mua_token');}
  user():User|null { const raw=localStorage.getItem('mua_user'); return raw?JSON.parse(raw):null; }
  isLoggedIn(){return !!this.token();}
}
