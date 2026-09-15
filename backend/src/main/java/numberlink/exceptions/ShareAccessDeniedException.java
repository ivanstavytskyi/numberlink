package numberlink.exceptions;

import org.springframework.http.HttpStatus;

public class ShareAccessDeniedException extends ApiException {
    public ShareAccessDeniedException() {
        super(HttpStatus.FORBIDDEN, "SHARE_FORBIDDEN", "This result is private");
    }
}
