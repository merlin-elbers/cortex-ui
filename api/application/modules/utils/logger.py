import os
import logging
from typing import Literal

LogScope = Literal["database", "auth", "request", "mail", "error"]

def get_logger(scope: LogScope, level: int = logging.INFO) -> logging.Logger:
    log_dir = os.path.join(os.getcwd(), "logs")
    os.makedirs(log_dir, exist_ok=True)

    log_file = os.path.join(log_dir, f"{scope}.log")
    logger_name = f"cortexui.{scope}"
    logger = logging.getLogger(logger_name)
    logger.setLevel(level)

    if not logger.handlers:
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        formatter = logging.Formatter('[%(asctime)s] %(levelname)s — %(message)s')
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger