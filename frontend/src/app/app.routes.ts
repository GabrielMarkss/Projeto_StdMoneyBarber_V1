import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AuthGuard } from './auth.guard';
import { GaleriaComponent } from './galeria/galeria.component';
import { AgendamentoComponent } from './agendamento/agendamento.component';
import { ProdutosComponent } from './produtos/produtos.component';
import { HomeComponent } from './home/home.component';
import { AgendamentoFelipeComponent } from './agendamento-felipe/agendamento-felipe.component';
import { AgendamentoEzequielComponent } from './agendamento-ezequiel/agendamento-ezequiel.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard],
    data: { requiresAuth: false }, // Só acessa se deslogado
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'galeria',
    component: GaleriaComponent,
  },
  {
    path: 'agendamento',
    component: AgendamentoComponent,
  },
  {
    path: 'felipe',
    component: AgendamentoFelipeComponent,
  },
  {
    path: 'ezequiel',
    component: AgendamentoEzequielComponent,
  },
  {
    path: 'produtos',
    component: ProdutosComponent,
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    data: { requiresAuth: true }, // Só acessa se logado
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
