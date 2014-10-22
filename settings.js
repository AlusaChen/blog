module.exports = {

	//############## db #############
	cookieSecret : 'myblog',
	db :'blog',
	host : 'localhost',

	//############## upload file #############
	imageFieldName : 'upfile',// file key same with umeditor.config.js
    savePath : 'upload', //  public/images/upload/  mkdir if not exists
    uploadPath : 'tmpupload', //  public/images/tmpupload/  mkdir if not exists
    maxSize : 1000, //max size kb
    allowFiles : [".gif" , ".png" , ".jpg" , ".jpeg" , ".bmp"],
};