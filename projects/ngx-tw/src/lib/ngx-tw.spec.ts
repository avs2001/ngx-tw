import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxTw } from './ngx-tw';

describe('NgxTw', () => {
  let component: NgxTw;
  let fixture: ComponentFixture<NgxTw>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxTw]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxTw);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
