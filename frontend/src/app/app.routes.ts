import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AuthGuard } from './auth.guard';
import { GaleriaComponent } from './galeria/galeria.component';
import { AgendamentoComponent } from './agendamento/agendamento.component';
import { ProdutosComponent } from './produtos/produtos.component';
import { HomeComponent } from './home/home.component';
import { MeusHorariosComponent } from './meus-horarios/meus-horarios.component';
import { PerfilComponent } from './perfil/perfil.component';

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
    path: 'meus-horarios',
    component: MeusHorariosComponent,
  },
  {
    path: 'produtos',
    component: ProdutosComponent,
  },
  {
    path: 'perfil',
    component: PerfilComponent,
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
