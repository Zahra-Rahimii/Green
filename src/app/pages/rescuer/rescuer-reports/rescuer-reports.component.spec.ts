import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RescuerReportsComponent } from './rescuer-reports.component';

describe('RescuerReportsComponent', () => {
  let component: RescuerReportsComponent;
  let fixture: ComponentFixture<RescuerReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RescuerReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RescuerReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
