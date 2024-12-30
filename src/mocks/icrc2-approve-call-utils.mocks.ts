import {Principal} from '@dfinity/principal';
import {IcrcCallCanisterResult} from '../types/icrc-responses';
import {mockLedgerCanisterId} from './icrc-call-utils.mocks';

export const mockIcrc2ApproveLocalIcRootKey = new Uint8Array([
  48, 129, 130, 48, 29, 6, 13, 43, 6, 1, 4, 1, 130, 220, 124, 5, 3, 1, 2, 1, 6, 12, 43, 6, 1, 4, 1, 130, 220, 124, 5, 3, 2, 1, 3, 97, 0, 129, 6, 102, 63, 3, 53, 55, 129, 51, 203, 97, 190, 30, 2, 63, 141, 246, 99, 241, 69, 17, 4, 47, 59, 149, 227, 251, 110, 34, 153, 69, 131, 245, 236, 6, 182, 218, 129, 12, 127, 124, 123, 88, 117, 211, 170, 6, 211, 20, 187, 23, 245, 108, 185, 244, 110, 169, 38, 93, 30, 128, 9, 80, 126, 154, 154, 47, 138, 24, 173, 248, 11, 204, 216, 6, 111, 228, 214, 26, 10, 34, 211, 123, 123, 177, 221, 227, 169, 81, 74, 250, 113, 141, 109, 138, 176
]);

export const mockIcrc2ApproveLocalRelyingPartyPrincipal = Principal.fromText(
  '6ngla-7dqvy-l73ju-54jt5-a4gvm-itu47-4dpih-e2h55-vtbzn-24yem-sae'
);

export const mockIcrc2ApproveLocalCallParams = {
  sender: 'ze7im-h75ws-wmw6d-lhd3w-3honz-35peh-rirlb-l5l6w-it5j5-tqzrn-dqe',
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
