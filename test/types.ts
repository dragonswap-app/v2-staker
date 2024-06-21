/// <reference path="./matchers/beWithin.ts"/>

import { createFixtureLoader } from './shared/provider'
import { DragonswapFixtureType } from './shared/fixtures'

export type LoadFixtureFunction = ReturnType<typeof createFixtureLoader>

export type TestContext = DragonswapFixtureType & {
  subject?: Function
}
