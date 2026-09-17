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

  // hard-source-webpack-plugin caches webpack's whole module graph -- module
  // resolution, parsing, dependencies and per-module source maps -- where the
  // babel cache above only stores transpiled output. The per-module source maps
  // are the point: they are what a full `source-map` build spends its time on.
  //
  // OPTIONAL DEPENDENCY, deliberately. It is not in package.json, because this
  // file also ships to devices whose node_modules predate it, and a hard
  // require would fail their build outright. Absent, this block is a no-op and
  // the build is exactly what it was.
  //   npm install --save-dev hard-source-webpack-plugin@0.13.1
  //   RUI_NO_HARD_SOURCE=1 ruibld   -> ignore it even when installed
  //
  // The plugin is unmaintained (last release 2019) and its known failure mode
  // is serving a stale cache after a config change -- which here means after
  // any change to this file or to the RUI_* variables. configHash below folds
  // both into the cache key so that cannot happen; if a build ever looks
  // impossibly stale anyway, delete node_modules/.cache/hard-source.
  if (process.env.RUI_NO_HARD_SOURCE !== "1") {
    let HardSourcePlugin = null
    try {
      HardSourcePlugin = require("hard-source-webpack-plugin")
    } catch (e) {
      HardSourcePlugin = null
    }
    if (HardSourcePlugin) {
      const fs = require("fs")
      const crypto = require("crypto")
      const selfHash = crypto
        .createHash("md5")
        .update(fs.readFileSync(__filename))
        .digest("hex")
      config.plugins.unshift(
        new HardSourcePlugin({
          configHash: () =>
            [
              selfHash,
              process.env.GENERATE_SOURCEMAP,
              process.env.RUI_SKIP_LINT,
              process.env.RUI_NO_COMPRESS,
              process.env.RUI_UNMINIFIED
            ].join("|")
        })
      )
      console.log("config-overrides: hard-source module cache enabled")
    }
  }

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

  // Minification is what makes the build undebuggable. With compress and mangle
  // on, the whole app lands on one line with renamed identifiers, so a browser
  // stack trace means nothing without a full `source-map` -- and producing one
  // costs ~38s on this hardware (measured 2026-09-17: npm build 16s -> 54s,
  // i.e. the entire speedup). The cheaper devtools are no help: they map lines
  // but not columns, and a minified bundle has one line.
  //
  // RUI_UNMINIFIED=1 attacks the cause instead of paying to undo it. Dropping
  // UglifyJsPlugin keeps module boundaries and original line structure, which
  // makes `cheap-module-source-map` accurate, and that variant is far cheaper
  // to build than `source-map`. Two costs at once are avoided: uglify does not
  // run, and the source map is the cheap kind. What it costs is bundle size --
  // nothing is minified at all.
  //
  // This supersedes RUI_NO_COMPRESS; if both are set, RUI_UNMINIFIED wins.
  if (process.env.RUI_UNMINIFIED === "1") {
    config.plugins = config.plugins.filter(
      p => !(p instanceof webpack.optimize.UglifyJsPlugin)
    )
    if (process.env.GENERATE_SOURCEMAP !== "false") {
      config.devtool = "cheap-module-source-map"
    }
    console.log(
      "config-overrides: minify off + cheap-module-source-map (RUI_UNMINIFIED=1)"
    )
  } else if (process.env.RUI_NO_COMPRESS === "1") {
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
