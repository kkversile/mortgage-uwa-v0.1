import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './pages/login.component';
import { ShellComponent } from './pages/shell.component';
import { DashboardComponent } from './pages/dashboard.component';
import { ApplicationsComponent } from './pages/applications.component';
import { ApplicationDetailComponent } from './pages/application-detail.component';
import { RulesComponent } from './pages/rules.component';
import { portalGuard } from './core/portal.guard';
import { ConsumerShellComponent } from './pages/consumer-shell.component';
import { ConsumerDashboardComponent } from './pages/consumer-dashboard.component';
import { ConsumerApplicationComponent } from './pages/consumer-application.component';
import { OperationsShellComponent } from './pages/operations-shell.component';
import { ProcessorComponent } from './pages/processor.component';
import { AdminShellComponent } from './pages/admin-shell.component';
import { AdminOverviewComponent } from './pages/admin-overview.component';
import { AdminUsersComponent } from './pages/admin-users.component';
import { AdminBranchesComponent } from './pages/admin-branches.component';
export const routes:Routes=[
  {path:'login',component:LoginComponent},
  {path:'consumer/login',component:LoginComponent},
  {path:'operations/login',component:LoginComponent},
  {path:'admin/login',component:LoginComponent},
  {path:'consumer',component:ConsumerShellComponent,canActivate:[portalGuard('consumer')],children:[
    {path:'dashboard',component:ConsumerDashboardComponent},
    {path:'application',component:ConsumerApplicationComponent},
    {path:'documents',component:ConsumerApplicationComponent},
    {path:'tasks',component:ConsumerDashboardComponent},
    {path:'',pathMatch:'full',redirectTo:'dashboard'}
  ]},
  {path:'operations',component:OperationsShellComponent,canActivate:[portalGuard('operations')],children:[
    {path:'dashboard',component:DashboardComponent},
    {path:'processor',component:ProcessorComponent},
    {path:'applications',component:ApplicationsComponent},
    {path:'applications/:id',component:ApplicationDetailComponent},
    {path:'rules',component:RulesComponent},
    {path:'',pathMatch:'full',redirectTo:'dashboard'}
  ]},
  {path:'admin',component:AdminShellComponent,canActivate:[portalGuard('admin')],children:[
    {path:'overview',component:AdminOverviewComponent},
    {path:'users',component:AdminUsersComponent},
    {path:'branches',component:AdminBranchesComponent},
    {path:'policies',component:AdminOverviewComponent},
    {path:'',pathMatch:'full',redirectTo:'overview'}
  ]},
  {path:'',component:ShellComponent,canActivate:[authGuard],children:[
    {path:'dashboard',component:DashboardComponent},
    {path:'applications',component:ApplicationsComponent},
    {path:'applications/:id',component:ApplicationDetailComponent},
    {path:'rules',component:RulesComponent},
    {path:'',pathMatch:'full',redirectTo:'dashboard'}
  ]},
  {path:'**',redirectTo:''}
];
