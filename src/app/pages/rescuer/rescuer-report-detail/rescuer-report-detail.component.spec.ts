import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RescuerReportDetailComponent } from './rescuer-report-detail.component';

describe('RescuerReportDetailComponent', () => {
  let component: RescuerReportDetailComponent;
  let fixture: ComponentFixture<RescuerReportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RescuerReportDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RescuerReportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
