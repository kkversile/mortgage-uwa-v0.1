import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Dashboard, ApplicationSummary } from '../models';
import { API_BASE_URL } from './app-config';
@Injectable({providedIn:'root'})
export class ApiService {
  private readonly base = API_BASE_URL;
  constructor(private http:HttpClient){}
  dashboard(){return this.http.get<Dashboard>(`${this.base}/dashboard`);}
  applications(){return this.http.get<ApplicationSummary[]>(`${this.base}/applications`);}
  application(id:string){return this.http.get<any>(`${this.base}/applications/${id}`);}
  createApplication(body:any){return this.http.post<any>(`${this.base}/applications`,body);}
  underwrite(id:string){return this.http.post<any>(`${this.base}/applications/${id}/underwrite`,{});}
  decide(id:string,finalDecision:string,reason:string){return this.http.post<any>(`${this.base}/applications/${id}/decision`,{finalDecision,reason});}
  rules(){return this.http.get<any[]>(`${this.base}/rules`);}
  adminOverview(){return this.http.get<any>(`${this.base}/admin/overview`);}
  adminUsers(){return this.http.get<any[]>(`${this.base}/admin/users`);}
  adminBranches(){return this.http.get<any[]>(`${this.base}/admin/branches`);}
  creditRun(id:string){return this.http.post<any>(`${this.base}/applications/${id}/credit/run`,{});}
  ausRun(id:string){return this.http.post<any>(`${this.base}/applications/${id}/aus/run`,{});}
  conditions(id:string){return this.http.get<any[]>(`${this.base}/applications/${id}/conditions`);}
  createCondition(id:string,body:any){return this.http.post<any>(`${this.base}/applications/${id}/conditions`,body);}
  transitionCondition(id:string,conditionId:string,status:string){return this.http.patch<any>(`${this.base}/applications/${id}/conditions/${conditionId}`,{status});}
  tasks(){return this.http.get<any[]>(`${this.base}/operations/tasks`);}
  completeTask(id:string){return this.http.patch<any>(`${this.base}/operations/tasks/${id}/complete`,{});}
  transitionApplication(id:string,targetStatus:string){return this.http.post<any>(`${this.base}/applications/${id}/transition`,{targetStatus});}
  uploadDocument(id:string, file:File, type:string){const body=new FormData();body.append('file',file);body.append('type',type);return this.http.post<any>(`${this.base}/applications/${id}/documents`,body);}
  downloadDocument(id:string, documentId:string){return this.http.get(`${this.base}/applications/${id}/documents/${documentId}/download`,{observe:'response',responseType:'blob'});}
}
