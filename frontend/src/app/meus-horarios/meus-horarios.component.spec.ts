import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeusHorariosComponent } from './meus-horarios.component';

describe('MeusHorariosComponent', () => {
  let component: MeusHorariosComponent;
  let fixture: ComponentFixture<MeusHorariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeusHorariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeusHorariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
