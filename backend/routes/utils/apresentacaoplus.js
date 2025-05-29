import {Open} from 'unzipper'


/**
 * 
 * @param {str} path - Caminho para o pptx 
 */

export  async function extractPptx(src, des)
{
  const directory = await Open.file(src)
  console.log('directory', directory)
  await directory.extract({path:des})
}