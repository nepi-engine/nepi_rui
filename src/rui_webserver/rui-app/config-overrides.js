/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
const { compose } = require("react-app-rewired")
const rewireMobX = require("react-app-rewire-mobx")
const webpack = require("webpack")

// Build-speed overrides, production build only. The dev server is untouched.
// No new dependencies: everything here uses what react-scripts already ships.
//
// Always on:
//   babel-loader caching -- react-scripts 1.1.5 runs babel with no cache in
//   production, so every file is retranspiled on every build.
//
// Opt in by environment variable:
//   RUI_SKIP_LINT=1     drop eslint-loader from the build
//   RUI_NO_COMPRESS=1   run uglify with mangle but no compress pass
//
// Both trade something real (lint coverage, bundle size) and are off by
// default. See bench_rui_build.sh for measured costs on this hardware.
function rewireBuildSpeed(config, env) {
  if (env !== "production") {
    return config
  }

  // Cache transpiled modules under node_modules/.cache/babel-loader. The cache
  // key is file contents, so the mtimes that build_nepi_rui.sh's rsync
  // preserves cannot produce a stale hit. With `cacheDirectory: true` rather
  // than an explicit path, babel-loader falls back to os.tmpdir() when
  // node_modules is not writable, so this can never fail the build -- but it
  // also means a permissions problem shows up only as lost speed, never as an
  // error. bench_rui_build.sh reports the cache directory and its writability
  // for exactly that reason.
  const addBabelCache = rule => {
    if (Array.isArray(rule.oneOf)) {
      rule.oneOf.forEach(addBabelCache)
    }
    if (Array.isArray(rule.use)) {
      rule.use.forEach(addBabelCache)
    }
    const loader = typeof rule === "string" ? rule : rule.loader
    if (typeof loader === "string" && loader.indexOf("babel-loader") !== -1) {
      rule.options = Object.assign({}, rule.options, { cacheDirectory: true })
    }
  }
  config.module.rules.forEach(addBabelCache)

  // eslint-loader runs over every source file on every production build. It
  // only ever warns here (nothing sets CI=true), so skipping it changes no
  // output -- it just removes the warnings from the log.
  if (process.env.RUI_SKIP_LINT === "1") {
    const keep = rule => {
      const uses = Array.isArray(rule.use)
        ? rule.use
        : rule.use
          ? [rule.use]
          : [rule]
      return !uses.some(u => {
        const l = typeof u === "string" ? u : u && u.loader
        return typeof l === "string" && l.indexOf("eslint-loader") !== -1
      })
    }
    config.module.rules = config.module.rules.filter(keep)
    config.module.rules.forEach(r => {
      if (Array.isArray(r.oneOf)) {
        r.oneOf = r.oneOf.filter(keep)
      }
    })
    console.log("config-overrides: eslint-loader skipped (RUI_SKIP_LINT=1)")
  }

  // uglify's compress pass is the expensive half of minification; mangle does
  // most of the size reduction for much less work. Dropping compress grows the
  // bundle, which matters little for a UI served over the LAN from the device
  // itself, but it is a real artifact change so it stays opt in.
  if (process.env.RUI_NO_COMPRESS === "1") {
    config.plugins = config.plugins.map(plugin => {
      if (!(plugin instanceof webpack.optimize.UglifyJsPlugin)) {
        return plugin
      }
      return new webpack.optimize.UglifyJsPlugin({
        compress: false,
        mangle: {
          safari10: true
        },
        output: {
          comments: false,
          // Emoji and regex are not minified properly using the default:
          // https://github.com/facebookincubator/create-react-app/issues/2488
          ascii_only: true
        },
        sourceMap: process.env.GENERATE_SOURCEMAP !== "false"
      })
    })
    console.log("config-overrides: uglify compress off (RUI_NO_COMPRESS=1)")
  }

  return config
}

module.exports = compose(rewireMobX, rewireBuildSpeed)
