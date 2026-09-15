package numberlink.exceptions;

import org.springframework.http.HttpStatus;

public class ShareTokenNotFoundException extends ApiException {
    public ShareTokenNotFoundException() {
        super(HttpStatus.NOT_FOUND, "SHARE_NOT_FOUND", "Share token not found");
    }
}
