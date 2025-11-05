import {Principal} from '@icp-sdk/core/principal';
import type {IcrcCallCanisterResult} from '../types/icrc-responses';
import {mockLedgerCanisterId} from './icrc-call-utils.mocks';

export const mockIcrc2LocalIcRootKey = new Uint8Array([
  48, 129, 130, 48, 29, 6, 13, 43, 6, 1, 4, 1, 130, 220, 124, 5, 3, 1, 2, 1, 6, 12, 43, 6, 1, 4, 1,
  130, 220, 124, 5, 3, 2, 1, 3, 97, 0, 129, 6, 102, 63, 3, 53, 55, 129, 51, 203, 97, 190, 30, 2, 63,
  141, 246, 99, 241, 69, 17, 4, 47, 59, 149, 227, 251, 110, 34, 153, 69, 131, 245, 236, 6, 182, 218,
  129, 12, 127, 124, 123, 88, 117, 211, 170, 6, 211, 20, 187, 23, 245, 108, 185, 244, 110, 169, 38,
  93, 30, 128, 9, 80, 126, 154, 154, 47, 138, 24, 173, 248, 11, 204, 216, 6, 111, 228, 214, 26, 10,
  34, 211, 123, 123, 177, 221, 227, 169, 81, 74, 250, 113, 141, 109, 138, 176
]);

export const mockIcrc2LocalRelyingPartyPrincipal = Principal.fromText(
  '6ngla-7dqvy-l73ju-54jt5-a4gvm-itu47-4dpih-e2h55-vtbzn-24yem-sae'
);

export const mockIcrc2LocalWalletPrincipal = Principal.fromText(
  'ze7im-h75ws-wmw6d-lhd3w-3honz-35peh-rirlb-l5l6w-it5j5-tqzrn-dqe'
);

// Approve mocks

export const mockIcrc2ApproveLocalCallParams = {
  sender: mockIcrc2LocalWalletPrincipal.toText(),
  method: 'icrc2_approve',
  canisterId: mockLedgerCanisterId,
  arg: 'RElETAZufW17bgFueGwCs7DawwNorYbKgwUCbAjG/LYCALqJ5cIEAqLelOsGAoLz85EMA9ijjKgNfZGcnL8NAN6n99oNA8uW3LQOBAEFAZBOAAAAgOHrFwAAAR1wrhf9pp3iZ9Bw1WInTn+Deg5NH72sw5brmCMkAgA='
};

export const mockIcrc2ApproveLocalCallResult: IcrcCallCanisterResult = {
  certificate:
    '2dn3omlzaWduYXR1cmVYMIC3logCob8DYcIFy9gebO0DvZVd2iccOAz5AHL3aAxsYCZThCisjNBEyONoQv0DPWR0cmVlgwGDAYIEWCAS9O1o7R14YUVtryMC6wOuqmjDSDbx9KmJQHyCDPd+VYMBggRYIL82mnbOr7Ko9rvdYzaGWcIiOsRbiHRqrB66XO9NBFHngwJOcmVxdWVzdF9zdGF0dXODAYIEWCAHPsrkYM5hgpPtyoKK/NOHGHctkzcEZfRc2gdsdJqe9IMBggRYIFM7zdSXahl4OcOAf1cZZln87BKyv4WzJhBF27kKpiR+gwJYIPcCRu6ehaKC8oNJ55f+vDizz1uJejM/bnYIck6iFlAsgwGDAkVyZXBseYIDWIFESURMCGsCvIoBfcX+0gEBawnRxJh8AsKR7LkCf+uCqJcEA6HD6/0HBJyE6PwIBfCH5tsJBpPlvsgMf4WP7pUPBuuc29UPB2wCx+vE0AlxxJixtQ19bAGLvfKbAX1sAb+bt/ANfWwBkq7O5Q99bAGju5GMCnhsAZy6tpwCfQEAAAiDAkZzdGF0dXOCA0dyZXBsaWVkgwGCBFggsSMhqVzG1RvK/79hnq0Fwcpekky581QV2c0zi57paLCDAkR0aW1lggNJ69ajhMbo/IoY',
  contentMap:
    '2dn3p2NhcmdYekRJREwGbn1te24BbnhsArOw2sMDaK2GyoMFAmwIxvy2AgC6ieXCBAKi3pTrBgKC8/ORDAPYo4yoDX2RnJy/DQDep/faDQPLlty0DgQBBQGQTgAAAIDh6xcAAAEdcK4X/aad4mfQcNViJ05/g3oOTR+9rMOW65gjJAIAa2NhbmlzdGVyX2lkSgAAAAAAAAACAQFuaW5ncmVzc19leHBpcnkbGBXzcXKOqABrbWV0aG9kX25hbWVtaWNyYzJfYXBwcm92ZWVub25jZVBXwYWRUzGfXvqMpVDTv+5GbHJlcXVlc3RfdHlwZWRjYWxsZnNlbmRlclgd/bSsy3hrOPdtnc3O+vIeKIrCvq/WRPqezhmLRwI='
};

export const mockIcrc2ApproveLocalCallTime = new Date(Date.parse('2024-12-30T12:12:00.000Z'));

export const mockIcrc2ApproveLocalBlockHeight = 8n;

// Transfer from mocks

export const mockIcrc2TransferFromLocalCallParams = {
  ...mockIcrc2ApproveLocalCallParams,
  method: 'icrc2_transfer_from',
  arg: 'RElETAZte24AbAKzsNrDA2ithsqDBQFufW54bAf7ygECxvy2AgPhhcGUAgHqyoqeBAK6ieXCBAGC8/ORDATYo4yoDX0BBQEdcK4X/aad4mfQcNViJ05/g3oOTR+9rMOW65gjJAIAAAABHf20rMt4azj3bZ3NzvryHiiKwr6v1kT6ns4Zi0cCAAAAwPD1Cw=='
};

export const mockIcrc2TransferFromLocalCallResult: IcrcCallCanisterResult = {
  certificate:
    '2dn3omlzaWduYXR1cmVYMJFCwHeFc/bu+KqcTgJ51YpsztIDCLzG+D/DEiB5q7ehre5pezfBOkdwlsz3KyRfZ2R0cmVlgwGDAYIEWCDq18IVU+dMZh3PDmralOOBqSdmIZNvjDyanIyr9TfclIMBggRYIFghWA1zGC7YseiKGQRMlABq1h3wm6wnw9q+mN1ENdJ/gwJOcmVxdWVzdF9zdGF0dXODAYMBgwGCBFggAKQnJau/gOt6oTaRQtBZBxRr2aBU6pgmFtPcb2BhOlSDAYMBggRYIN2OQR4karXwjh4qsc0MOU6cMPYFZ/82y/9WnyXRBe3ugwJYIDIrGZBwLNmJJpYhvsatvU4VSKK0t/wXan4bhpQw4ZvqgwGDAkVyZXBseYIDWIlESURMCWsCvIoBfcX+0gEBawnRxJh8AsKR7LkCf7XamqMDA5TBx4kEBOuCqJcEBaHD6/0HBvCH5tsJB5PlvsgMf+uc29UPCGwCx+vE0AlxxJixtQ19bAHYu7KEDH1sAZuzvqYKfWwBi73ymwF9bAG/m7fwDX1sAaO7kYwKeGwBnLq2nAJ9AQAAIIMCRnN0YXR1c4IDR3JlcGxpZWSCBFggmsuVwna+Rf951EyGY8WFZu8UBkXPYiuuAHGBhni9ywSCBFggpX9Goh6jf9hl5+b7cypd+aH7xd5643a3vIlOZShrEOmCBFggeWudrZcOvy3SQA6+lK1EK08HX7DJk8tHKB4+HF/mwQ6DAYIEWCArDpAWFa9ktOHy/2f5mVY6QUDu5VT3tpwaYSHzShq5CoMCRHRpbWWCA0mhx8XD+oiNixg=',
  contentMap:
    '2dn3p2NhcmdYjkRJREwGbXtuAGwCs7DawwNorYbKgwUBbn1ueGwH+8oBAsb8tgID4YXBlAIB6sqKngQCuonlwgQBgvPzkQwE2KOMqA19AQUBHXCuF/2mneJn0HDVYidOf4N6Dk0fvazDluuYIyQCAAAAAR39tKzLeGs4922dzc768h4oisK+r9ZE+p7OGYtHAgAAAMDw9QtrY2FuaXN0ZXJfaWRKAAAAAAAAAAIBAW5pbmdyZXNzX2V4cGlyeRsYFjR9fsBoAGttZXRob2RfbmFtZXNpY3JjMl90cmFuc2Zlcl9mcm9tZW5vbmNlUMFWSiN+XO/9CtZkWdc3DsZscmVxdWVzdF90eXBlZGNhbGxmc2VuZGVyWB39tKzLeGs4922dzc768h4oisK+r9ZE+p7OGYtHAg=='
};

export const mockIcrc2TransferFromLocalCallTime = new Date(Date.parse('2024-12-31T08:05:00.000Z'));

export const mockIcrc2TransferFromLocalBlockHeight = 32n;
