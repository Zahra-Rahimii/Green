import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RescuerMapComponent } from './rescuer-map.component';

describe('RescuerMapComponent', () => {
  let component: RescuerMapComponent;
  let fixture: ComponentFixture<RescuerMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RescuerMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RescuerMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
