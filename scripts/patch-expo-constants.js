const fs = require('fs');
const path = require('path');

const patchedContent = `// Gradle script for generating serialized public app config (from app.config.js/ts or app.json) and bundling it into the APK

import org.apache.tools.ant.taskdefs.condition.Os


def expoConstantsDir = project.providers.exec {
  workingDir(projectDir)
  commandLine("node", "-e", "console.log(require('path').dirname(require.resolve('expo-constants/package.json')));")
}.standardOutput.asText.get().trim()

def config = project.hasProperty("react") ? project.react : [];
def nodeExecutableAndArgs = config.nodeExecutableAndArgs ?: ["node"]

afterEvaluate {
  def expoGradleExtension = gradle.extensions.findByName("expoGradle")
  def customProjectRoot = expoGradleExtension?.projectRoot
  def projectRoot = file("\${customProjectRoot ?: rootProject.projectDir}")

  def registerConfigForVariant = { String variantName, boolean isDebug ->
    def assetsDir = file("\$buildDir/generated/assets/expo-constants/\${variantName}")
    def configMode = isDebug ? "development" : "production"

    def createConfigTask = tasks.register("create\${variantName.capitalize()}ExpoConfig", Exec) {
      description = 'expo-constants: Create app.config.'

      doFirst {
        assetsDir.deleteDir()
        assetsDir.mkdirs()
      }

      // Mark the task as always out-of-date so it always runs - ie. regenerate app.config on every build
      outputs.upToDateWhen { false }

      // Set up outputs so gradle can cache the result
      outputs.dir assetsDir

      // Switch to project root and generate the app config
      workingDir projectRoot

      // The \`false\` argument turns the fingerprint embed off here: the task below owns it.
      if (Os.isFamily(Os.FAMILY_WINDOWS)) {
        commandLine("cmd", "/c", *nodeExecutableAndArgs, "\$expoConstantsDir/scripts/getAppConfig.js", projectRoot, assetsDir, "android", "false", configMode)
      } else {
        commandLine(*nodeExecutableAndArgs, "\$expoConstantsDir/scripts/getAppConfig.js", projectRoot, assetsDir, "android", "false", configMode)
      }
    }

    if (tasks.findByName("pre\${variantName.capitalize()}Build") != null) {
      tasks.named("pre\${variantName.capitalize()}Build").configure { it.dependsOn(createConfigTask) }
    } else {
      tasks.named("preBuild").configure { it.dependsOn(createConfigTask) }
    }

    // Add generated assetsDir into assets.srcDirs
    project.android.sourceSets.maybeCreate(variantName).assets.srcDirs += assetsDir
  }

  if (project.android.hasProperty("libraryVariants")) {
    project.android.libraryVariants.all { variant ->
      registerConfigForVariant(variant.name, variant.buildType.name == "debug" || variant.buildType.name == "debugOptimized")
    }
  } else {
    def buildTypeNames = project.android.buildTypes.names
    buildTypeNames.each { buildTypeName ->
      registerConfigForVariant(buildTypeName, buildTypeName == "debug" || buildTypeName == "debugOptimized")
    }
  }

  def fingerprintAssetsDir = file("\$buildDir/generated/assets/expo-constants-fingerprint")

  def createFingerprintTask = tasks.register('createExpoFingerprint', Exec) {
    description = 'expo-constants: Embed the project fingerprint (app.fingerprint) in debug builds.'

    doFirst {
      fingerprintAssetsDir.deleteDir()
      fingerprintAssetsDir.mkdirs()
    }

    // The fingerprint hashes sources across the whole project, so always regenerate it
    outputs.upToDateWhen { false }
    outputs.dir fingerprintAssetsDir

    workingDir projectRoot

    if (Os.isFamily(Os.FAMILY_WINDOWS)) {
      commandLine("cmd", "/c", *nodeExecutableAndArgs, "\$expoConstantsDir/scripts/createFingerprintFile.js", projectRoot, fingerprintAssetsDir, "android")
    } else {
      commandLine(*nodeExecutableAndArgs, "\$expoConstantsDir/scripts/createFingerprintFile.js", projectRoot, fingerprintAssetsDir, "android")
    }
  }

  if (project.android.hasProperty("libraryVariants")) {
    project.android.libraryVariants.all { variant ->
      if (!variant.buildType.debuggable) {
        return
      }
      variant.preBuildProvider.configure { it.dependsOn(createFingerprintTask) }
      project.android.sourceSets.maybeCreate(variant.buildType.name).assets.srcDirs += fingerprintAssetsDir
    }
  } else {
    project.android.buildTypes.matching { it.name == "debug" || (it.hasProperty("debuggable") && it.debuggable) }.all { buildType ->
      tasks.named("preBuild").configure { it.dependsOn(createFingerprintTask) }
      project.android.sourceSets.maybeCreate(buildType.name).assets.srcDirs += fingerprintAssetsDir
    }
  }
}
`;

function patchFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, patchedContent, 'utf8');
      console.log('Successfully patched:', filePath);
    }
  } catch (err) {
    console.warn('Failed to patch:', filePath, err.message);
  }
}

function findAndPatch(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'scripts' && fs.existsSync(path.join(fullPath, 'get-app-config-android.gradle'))) {
          patchFile(path.join(fullPath, 'get-app-config-android.gradle'));
        } else {
          findAndPatch(fullPath);
        }
      }
    }
  } catch (err) {
    // Ignore permissions or read errors
  }
}

console.log('Running patch-expo-constants...');
const rootDir = path.resolve(__dirname, '..');
findAndPatch(path.join(rootDir, 'node_modules'));
console.log('Finished patch-expo-constants.');
