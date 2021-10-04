import { TestBed } from '@angular/core/testing';

import { PeerServiceService } from './peer-service.service';

describe('PeerServiceService', () => {
  let service: PeerServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PeerServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
