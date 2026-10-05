import { test, expect } from '@playwright/test';
import { readDemandConfig } from '../../demand/config';
import { executionEnvironment } from '../../demand/execute-run';
import { pricingExecutionSettings } from '../../pricing/run';
import { routeExecutionSettings } from '../../optimization/route-execution-run';

const githubContext = {
  GITHUB_ACTIONS: 'true',
  GITHUB_REPOSITORY: 'example-user/Airline-Manager-4-Automation',
  GITHUB_RUN_ID: '123',
  GITHUB_RUN_ATTEMPT: '1'
};

test('production guards accept a valid fork repository context', () => {
  const demandEnv:any = {
    ...githubContext,
    ENABLE_DEMAND_MANAGER: 'true',
    DEMAND_FAIL_SAFE: 'true',
    DEMAND_DRY_RUN: 'false',
    DEMAND_EXECUTION_ACK: 'individual-return-legs-v1',
    DEMAND_POOL_SCOPE: 'airport-pair',
    DEMAND_MAX_DEPARTURES_PER_RUN: '1'
  };
  expect(executionEnvironment(readDemandConfig(demandEnv), demandEnv)).toMatchObject({
    dryRun: false,
    maxDepartures: 1
  });

  expect(pricingExecutionSettings({
    ...githubContext,
    ENABLE_TICKET_PRICING_EXECUTION: 'true',
    TICKET_PRICING_EXECUTION_ACK: 'native-route-price-save-v1'
  })).toMatchObject({ enabled: true });

  expect(routeExecutionSettings({
    ...githubContext,
    ENABLE_ROUTE_EXECUTION: 'true',
    ROUTE_EXECUTION_ACK: 'native-direct-reroute-v1',
    DEMAND_DRY_RUN: 'false',
    ENABLE_ROUTE_OPTIMIZER: 'true'
  })).toMatchObject({ enabled: true });
});

test('production guards still reject malformed or non-Actions repository context', () => {
  const demandBase:any = {
    ...githubContext,
    ENABLE_DEMAND_MANAGER: 'true',
    DEMAND_FAIL_SAFE: 'true',
    DEMAND_DRY_RUN: 'false',
    DEMAND_EXECUTION_ACK: 'individual-return-legs-v1',
    DEMAND_POOL_SCOPE: 'airport-pair',
    DEMAND_MAX_DEPARTURES_PER_RUN: '1'
  };
  const malformed = {...demandBase, GITHUB_REPOSITORY:'not-a-repository'};
  expect(() => executionEnvironment(readDemandConfig(malformed), malformed))
    .toThrow('DEMAND_REAL_EXECUTION_CONTEXT_INVALID_OR_RERUN');

  const local = {...demandBase, GITHUB_ACTIONS:'false'};
  expect(() => executionEnvironment(readDemandConfig(local), local))
    .toThrow('DEMAND_REAL_EXECUTION_CONTEXT_INVALID_OR_RERUN');
});
