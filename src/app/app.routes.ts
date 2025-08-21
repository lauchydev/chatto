import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Profile } from './components/profile/profile';
import { authGuard } from './guards/auth-guard';
import { loginGuard } from './guards/login-guard';

export const routes: Routes = [
  { path: '', component: Dashboard, title: 'Dashboard', canActivate: [authGuard] },
  { path: 'login', component: Login, title: 'Login', canActivate: [loginGuard] },
  { path: 'profile', component: Profile, title: 'Profile', canActivate: [authGuard] },
];
