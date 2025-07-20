import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RescuerProfileComponent } from './rescuer-profile.component';

describe('RescuerProfileComponent', () => {
  let component: RescuerProfileComponent;
  let fixture: ComponentFixture<RescuerProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RescuerProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RescuerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
