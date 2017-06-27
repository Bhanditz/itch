import * as paths from "../../os/paths";
import client from "../../api";
import butler from "../../util/butler";

import rootLogger from "../../logger";

import downloadPatches from "./download-patches";
import getGameCredentials from "./get-game-credentials";
import isHeal from "./is-heal";

import { IDownloadItem, IDownloadResult } from "../../types";
import Context from "../../context";

export default async function performDownload(
  ctx: Context,
  item: IDownloadItem,
): Promise<IDownloadResult> {
  // TODO: we want to store download/install logs even if the cave never ends
  // up being valid, for bug reporting purposes.

  let parentLogger = rootLogger;
  if (item.caveId) {
    parentLogger = paths.caveLogger(item.caveId);
  }
  const logger = parentLogger.child({ name: `download` });

  const gameCredentials = await getGameCredentials(ctx, item.game);
  if (!gameCredentials) {
    throw new Error(`no game credentials, can't download`);
  }

  if (item.upgradePath && item.caveId) {
    logger.info("Got an upgrade path, downloading patches");

    return await downloadPatches(ctx, item, logger);
  }

  const { upload, caveId } = item;

  const api = client.withKey(gameCredentials.apiKey);

  const { preferences } = store.getState();

  const archivePath = paths.downloadPath(upload, preferences);

  if (isHeal(item)) {
    const buildId = upload.buildId;

    logger.info(`Downloading wharf-enabled download, build #${buildId}`);

    const archiveURL = api.downloadBuildURL(
      gameCredentials.downloadKey,
      upload.id,
      buildId,
      "archive",
    );
    const signatureURL = api.downloadBuildURL(
      gameCredentials.downloadKey,
      upload.id,
      buildId,
      "signature",
    );

    const cave = await ctx.db.caves.findOneById(caveId);

    const fullInstallFolder = paths.appPath(cave, preferences);
    logger.info(`Doing verify+heal to ${fullInstallFolder}`);

    await butler.verify(signatureURL, fullInstallFolder, {
      ctx,
      logger,
      heal: `archive,${archiveURL}`,
    });
  } else {
    const uploadURL = api.downloadUploadURL(
      gameCredentials.downloadKey,
      upload.id,
    );

    try {
      await butler.cp({
        ctx,
        src: uploadURL,
        dest: archivePath,
        resume: true,
        logger,
      });
    } catch (e) {
      if (e.errors && e.errors[0] === "invalid upload") {
        const e = new Error("invalid upload");
        (e as any).itchReason = "upload-gone";
        throw e;
      }
      throw e;
    }
  }

  return {
    archivePath,
  };
}
