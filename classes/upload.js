var settings = require('../settings'),
	fs = require('fs'),
	path = require('path')
;

function Upload(req)
{
	this.info = req.files[settings.imageFieldName];
}

Upload.stateMap = {   //上传状态映射表，国际化用户需考虑此处数据的国际化
    succeed : "SUCCESS" ,
    upload_max_filesize : "文件大小超出 upload_max_filesize 限制" ,
    max_file_size : "文件大小超出 MAX_FILE_SIZE 限制" ,
    not_complete : "文件未被完整上传" ,
    not_upload : "没有文件被上传" ,
    empty_upload : "上传文件为空" ,
    post : "文件大小超出 post_max_size 限制" ,
    size : "文件大小超出网站限制" ,
    type : "不允许的文件类型" ,
    dir : "目录创建失败" ,
    io : "输入输出错误" ,
    unknown : "unknown error" ,
    move : "move error",
    save_dir_not_exists : "save dir does't exits",
    dir_error : "create dir error"
};

Upload.prototype.stateInfo = Upload.stateMap.succeed;
Upload.prototype.oriName = '';
Upload.prototype.fileName = '';
Upload.prototype.fileSize = 0;
Upload.prototype.fileType = '';


Upload.prototype.upFile = function(){
	if(!this.info) {
		this.stateInfo = Upload.stateMap.post;
		return;
	}

	if(this.info.error) {
		this.stateInfo = Upload.stateMap[this.info.error];
		return;
	}

	this.filename = path.basename(this.info.path);
	this.oriName = this.info.originalFilename;
	this.fileSize = this.info.size;
	this.fileType = path.extname(this.filename);

	if(this.fileSize > settings.maxSize * 1024) {
		this.stateInfo = Upload.stateMap.size;
		return;
	}

	if(settings.allowFiles.indexOf(this.fileType) < 0) {
		this.stateInfo = Upload.stateMap.type;
		return;
	}

	//check dir exists
	if(!fs.existsSync(path.join('public/images', settings.savePath))) {
		this.stateInfo = Upload.stateMap.save_dir_not_exists;
		return;
	}

	var target_path = path.join('public/images', settings.savePath, this.filename);

	fs.renameSync(this.info.path, target_path);
	//if move error

}

Upload.prototype.getFileInfo = function(callback) {
	var ret = {
		originalName : this.oriName,
		name : this.filename,
		url : path.join('images', settings.savePath, this.filename),
		size : this.fileSize,
		type : this.fileType,
		state : this.stateInfo
	};
	callback(ret);
}

module.exports = Upload;