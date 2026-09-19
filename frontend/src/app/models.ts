export interface User { id:string; userId?:string; email:string; displayName:string; role:string; accountType?:string; portal?:string; tenantId?:string; membershipId?:string; branchId?:string; roles?:string[]; permissions?:string[]; }
export interface LoginResponse { accessToken:string; user:User; }
export interface Dashboard { metrics:{total:number;approved:number;declined:number;manualReview:number;ready:number}; recent:any[]; }
export interface ApplicationSummary { id:string; applicationNumber:string; status:string; requestedLoanAmount:string; updatedAt:string; applicant?:{firstName:string;lastName:string;email:string}; underwriter?:{displayName:string}; creditReports?:any[]; financialAssessments?:any[]; }
