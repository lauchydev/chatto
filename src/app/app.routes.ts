import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Profile } from './pages/profile/profile';
import { authGuard } from './guards/auth-guard';
import { loginGuard } from './guards/login-guard';
import { Signup } from './pages/signup/signup';

export const routes: Routes = [
  { path: '', component: Dashboard, title: 'Chatto | Dashboard', canActivate: [authGuard] },
  { path: 'login', component: Login, title: 'Chatto | Login', canActivate: [loginGuard] },
  { path: 'profile', component: Profile, title: 'Chatto | Profile', canActivate: [authGuard] },
  { path: 'signup', component: Signup, title: 'Chatto | Register', canActivate: [loginGuard] },
];
